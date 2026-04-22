import Submission from "../models/Submission.js";
import Task from "../models/Task.js";
import { notifyUser, notifyDivision } from "../services/notificationService.js";

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
    const { contentUrl, comment, repository_url, repositoryUrl, repoUrl, link, url } = req.body;
    const studentId = req.user.id;
    const submissionUrl = contentUrl || repository_url || repositoryUrl || repoUrl || link || url;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (!submissionUrl) {
      return res.status(400).json({ error: "Submission content (URL/Link) is required" });
    }

    // Verify student is in the task's division
    const taskDivisionId = task.division;

    if (!userHasDivisionAccess(req.user, taskDivisionId)) {
      return res.status(403).json({ error: "You are not assigned to a division" });
    }

    if (!req.user.division) {
      req.user.division = taskDivisionId;
      await req.user.save();
    }

    const studentDivisionId = getUserDivisionId(req.user);
    if (studentDivisionId && studentDivisionId.toString() !== taskDivisionId.toString()) {
      return res.status(403).json({ error: "You cannot submit tasks for a different division" });
    }

    // Check deadline
    if (new Date() > new Date(task.deadline)) {
       return res.status(400).json({ error: "Deadline has passed" });
    }

    const submission = await Submission.create({
      task: taskId,
      student: studentId,
      contentUrl: submissionUrl,
      comment
    });

    res.status(201).json({ success: true, data: submission });

    // Notify division instructors/admins about the new submission
    notifyDivision({
      senderId: req.user.id,
      divisionId: taskDivisionId,
      title: "New Task Submission",
      message: `${req.user.email} has submitted the task: "${task.title}".`,
      type: "info",
      link: `/submissions/${submission._id}`,
      requester: req.user
    }).catch(err => console.error("Notification Error:", err));
  } catch (error) {
    if (error.code === 11000) {
       return res.status(400).json({ error: "You have already submitted this task" });
    }
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Update a submission (Student only)
export const updateSubmission = async (req, res) => {
  try {
    const { contentUrl, comment } = req.body;
    const submission = await Submission.findById(req.params.id).populate("task");

    if (!submission) return res.status(404).json({ error: "Submission not found" });

    // Verify it's the student's own submission
    if (submission.student.toString() !== req.user.id.toString()) {
       return res.status(403).json({ error: "You can only edit your own submissions" });
    }

    // Only allow editing if it hasn't been reviewed yet
    if (submission.status !== 'pending') {
       return res.status(400).json({ error: "Submission has already been reviewed and cannot be edited" });
    }

    // Check deadline
    if (new Date() > new Date(submission.task.deadline)) {
       return res.status(400).json({ error: "Deadline has passed, you can no longer edit your submission" });
    }

    submission.contentUrl = contentUrl || submission.contentUrl;
    submission.comment = comment || submission.comment;
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
    const reviewerId = req.user.id;

    const submission = await Submission.findById(req.params.id).populate("task");
    if (!submission) return res.status(404).json({ error: "Submission not found" });

    // RBAC check: Reviewer must be in the same division
     const reviewerDivisionId = getUserDivisionId(req.user);
     if (req.user.role === 'admin' && !userHasDivisionAccess(req.user, submission.task.division)) {
       return res.status(403).json({ error: "You can only review submissions in your division" });
    }
    // Instructors might have more granular checks (if assigned) - for now keep it simple

    submission.status = status;
    submission.feedback = feedback;
    submission.grade = grade;
    submission.reviewedBy = reviewerId;
    submission.reviewedAt = new Date();

    await submission.save();

    res.status(200).json({ success: true, data: submission });

    // Notify student about the review
    notifyUser({
      senderId: req.user.id,
      recipientId: submission.student,
      title: "Submission Reviewed",
      message: `Your submission for "${submission.task.title}" has been reviewed. Grade: ${grade || 'N/A'}.`,
      type: "grading",
      link: `/submissions/${submission._id}`
    }).catch(err => console.error("Notification Error:", err));
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
       filter.student = req.user.id;
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
      .populate("student", "email")
      .populate("task", "title")
      .populate("reviewedBy", "email");

    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};
