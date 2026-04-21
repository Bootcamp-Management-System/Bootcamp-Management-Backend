import Submission from "../models/Submission.js";
import Task from "../models/Task.js";

export const submitTask = async (task_id, repository_url, user) => {
  const task = await Task.findById(task_id);
  
  if (!task) {
    const err = new Error("Task not found");
    err.statusCode = 404;
    throw err;
  }
  
  if (user.role === 'student' && task.division.toString() !== user.division.toString()) {
     const err = new Error("You can only submit tasks for your own division");
     err.statusCode = 403;
     throw err;
  }

  const existingSubmission = await Submission.findOne({ task: task_id, student: user._id });
  
  if (existingSubmission) {
    const err = new Error("You have already submitted this task");
    err.statusCode = 400;
    throw err;
  }

  const submission = await Submission.create({
    task: task_id,
    student: user._id,
    repository_url
  });
  
  return submission;
};

export const getSubmissionsForTask = async (task_id, division_id) => {
  const query = { task: task_id };

  if (division_id) {
    const task = await Task.findById(task_id);
    if (task && task.division.toString() !== division_id) {
        const err = new Error("Unauthorized access to this task's submissions");
        err.statusCode = 403;
        throw err;
    }
  }

  const submissions = await Submission.find(query)
    .populate('student', 'email')
    .populate('task', 'title division');

  return submissions;
};

export const gradeSubmission = async (submission_id, marks, comments, division_id) => {
  const submission = await Submission.findById(submission_id).populate('task');
  if (!submission) {
     const err = new Error("Submission not found");
     err.statusCode = 404;
     throw err;
  }
  
  if (division_id && submission.task.division.toString() !== division_id) {
      const err = new Error("You can only grade submissions from your own division");
      err.statusCode = 403;
      throw err;
  }

  submission.marks = marks !== undefined ? marks : submission.marks;
  submission.comments = comments !== undefined ? comments : submission.comments;
  
  await submission.save();
  return submission;
};

export const getMySubmissions = async (user_id) => {
  const submissions = await Submission.find({ student: user_id })
    .populate('task', 'title deadline')
    .sort('-createdAt');
  return submissions;
};