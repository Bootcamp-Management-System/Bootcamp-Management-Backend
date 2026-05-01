import mongoose from "mongoose";
import Submission from "../models/Submission.js";
import Task from "../models/Task.js";
import Enrollment from "../models/Enrollment.js";

const getUserId = (user) => user?._id || user?.id;

const getSubmissionPayload = (req) => {
  const {
    contentUrl,
    projectUrl,
    githubUrl,
    github_url,
    repository_url,
    repositoryUrl,
    repoUrl,
    driveUrl,
    drive_url,
    googleDriveUrl,
    comment,
  } = req.body;

  const fileUrl = req.file ? `/uploads/submissions/${req.file.filename}` : undefined;
  const fileName = req.file?.originalname;
  const nextGithubUrl = githubUrl || github_url || repository_url || repositoryUrl || repoUrl;
  const nextDriveUrl = driveUrl || drive_url || googleDriveUrl;
  const nextContentUrl = contentUrl || projectUrl;

  return {
    contentUrl: nextContentUrl,
    githubUrl: nextGithubUrl,
    driveUrl: nextDriveUrl,
    fileUrl,
    fileName,
    comment,
    submissionType: [
      fileUrl ? "file" : null,
      nextGithubUrl ? "github" : null,
      nextDriveUrl ? "drive" : null,
    ].filter(Boolean).length > 1
      ? "mixed"
      : (fileUrl ? "file" : nextGithubUrl ? "github" : nextDriveUrl ? "drive" : "mixed"),
  };
};

const getUserDivisionId = (user) => {
  if (user?.division) return user.division;
  if (Array.isArray(user?.assignedDivisions) && user.assignedDivisions.length > 0) {
    return user.assignedDivisions[0];
  }
  return null;
};

const userHasDivisionAccess = (user, divisionId) => {
  if (!divisionId) return false;

  if (user?.division && user.division.toString() === divisionId.toString()) {
    return true;
  }

  if (Array.isArray(user?.assignedDivisions)) {
    return user.assignedDivisions.some((assignedDivisionId) => {
      return assignedDivisionId && assignedDivisionId.toString() === divisionId.toString();
    });
  }

  return false;
};

// @desc    Submit a task (Student only)
export const submitTask = async (req, res) => {
  try {
    const taskId = req.params.taskId || req.body.taskId;
    const studentId = getUserId(req.user);
    const payload = getSubmissionPayload(req);

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (!payload.contentUrl && !payload.githubUrl && !payload.driveUrl && !payload.fileUrl) {
      return res.status(400).json({ error: "Submit a file, GitHub link, Google Drive link, or project link" });
    }

    const enrollment = await Enrollment.findOne({
      student: studentId,
      bootcamp: task.bootcamp,
      is_active: true,
    });

    if (!enrollment) {
      return res.status(403).json({ error: "You can only submit tasks for bootcamps you are enrolled in" });
    }

    let submission = await Submission.findOne({ task: taskId, student: studentId });
    const isReturnedForResubmission = ["returned", "resubmission_required"].includes(submission?.status);

    // Check deadline. Returned work can be resubmitted for version tracking.
    if (!isReturnedForResubmission && new Date() > new Date(task.deadline)) {
       return res.status(400).json({ error: "Deadline has passed" });
    }

    if (submission) {
      submission.versions.push({
        contentUrl: submission.contentUrl,
        githubUrl: submission.githubUrl,
        driveUrl: submission.driveUrl,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
        comment: submission.comment,
        submittedAt: submission.updatedAt || submission.createdAt || new Date(),
      });
      submission.version += 1;
      Object.assign(submission, payload, {
        status: "pending",
        feedback: undefined,
        grade: undefined,
        reviewedBy: undefined,
        reviewedAt: undefined,
      });
      await submission.save();
      return res.status(200).json({ success: true, data: submission });
    }

    submission = await Submission.create({
      task: taskId,
      student: studentId,
      ...payload,
    });

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Update a submission (Student only)
export const updateSubmission = async (req, res) => {
  try {
    const payload = getSubmissionPayload(req);
    const submission = await Submission.findById(req.params.id).populate("task");

    if (!submission) return res.status(404).json({ error: "Submission not found" });

    // Verify it's the student's own submission
    if (submission.student.toString() !== getUserId(req.user).toString()) {
       return res.status(403).json({ error: "You can only edit your own submissions" });
    }

    if (submission.status === "graded") {
       return res.status(400).json({ error: "Graded submissions cannot be edited" });
    }

    const isReturnedForResubmission = ["returned", "resubmission_required"].includes(submission.status);

    // Check deadline. Returned work can be resubmitted for version tracking.
    if (!isReturnedForResubmission && new Date() > new Date(submission.task.deadline)) {
       return res.status(400).json({ error: "Deadline has passed, you can no longer edit your submission" });
    }

    submission.versions.push({
      contentUrl: submission.contentUrl,
      githubUrl: submission.githubUrl,
      driveUrl: submission.driveUrl,
      fileUrl: submission.fileUrl,
      fileName: submission.fileName,
      comment: submission.comment,
      submittedAt: submission.updatedAt || submission.createdAt || new Date(),
    });
    submission.version += 1;
    Object.assign(submission, payload, {
      status: "pending",
      feedback: undefined,
      grade: undefined,
      reviewedBy: undefined,
      reviewedAt: undefined,
    });
    await submission.save();

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Review a submission (Instructor/Admin only)
export const reviewSubmission = async (req, res) => {
  try {
    const { status, feedback, grade } = req.body;
    const reviewerId = getUserId(req.user);

    const submission = await Submission.findById(req.params.id).populate("task");
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    // Contextual Permission Check
    const task = submission.task;
    const isGlobalAdmin = ['super-admin', 'admin'].includes(req.user.role);
    let isSessionInstructor = false;

    if (task.session) {
       // Need to fetch session to check instructor
       const Session = mongoose.model('Session');
       const session = await Session.findById(task.session);
       isSessionInstructor = session?.instructor?.toString() === getUserId(req.user).toString();
    }

    if (!isGlobalAdmin && !isSessionInstructor) {
       return res.status(403).json({ error: "You do not have permission to review this submission. Only the assigned instructor or division admin can do this." });
    }

    // Admin Division Check
    if (req.user.role === 'admin' && !userHasDivisionAccess(req.user, task.division)) {
       return res.status(403).json({ error: "Admins can only review submissions in their own division" });
    }

    const normalizedStatus = status === "reviewed" ? "graded" : status === "resubmission_required" ? "returned" : status;
    if (!["graded", "returned"].includes(normalizedStatus)) {
      return res.status(400).json({ error: "Status must be Graded or Returned" });
    }

    submission.status = normalizedStatus;
    submission.feedback = feedback;
    submission.grade = grade;
    submission.reviewedBy = reviewerId;
    submission.reviewedAt = new Date();

    await submission.save();

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Get submissions (Filtered)
export const getSubmissions = async (req, res) => {
  try {
    const { taskId, studentId } = req.query;
    const filter = {};

    if (taskId) filter.task = taskId;
    if (studentId) filter.student = studentId;

    // RBAC logic for viewing
    if (req.user.role === 'student') {
       filter.student = getUserId(req.user);
    } else if (req.user.role === 'instructor' || req.user.role === 'admin') {
       // Controller handles basic filter, but we might want to ensure they see right division
       // For now, if taskId is provided, verify they have access to that task
       if (taskId) {
          const task = await Task.findById(taskId);
          if (task && req.user.role === 'admin' && task.division.toString() !== req.user.division.toString()) {
             return res.status(403).json({ error: "Access denied to these submissions" });
          }
       }
    }

    const submissions = await Submission.find(filter)
      .populate("student", "name email")
      .populate("task", "title maxScore")
      .populate("reviewedBy", "email");

    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};
