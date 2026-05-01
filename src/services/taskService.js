import Task from "../models/Task.js";
import Session from "../models/Session.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";

export const createTask = async (taskData, creator) => {
  const { title, description, projectLink, maxScore, submissionTypes, session } = taskData;
  let { bootcamp, division, startTime, endTime, deadline } = taskData;

  if (session) {
    const sessionData = await Session.findById(session);
    if (!sessionData) {
      const err = new Error("Session not found");
      err.statusCode = 404;
      throw err;
    }

    // Infer bootcamp if missing
    if (!bootcamp && sessionData.bootcamp) {
      bootcamp = sessionData.bootcamp;
    }

    if (!division && sessionData.division) {
      division = sessionData.division;
    }
    
    // Contextual Permission Check
    const isSuperAdmin = creator.role === 'super-admin' || creator.role === 'super_admin';
    const isAdminOfDivision = creator.role === 'admin' && creator.division?.toString() === sessionData.division?.toString();
    const isSessionInstructor = sessionData.instructor?.toString() === (creator._id || creator.id)?.toString();

    if (!isSuperAdmin && !isAdminOfDivision && !isSessionInstructor) {
      const err = new Error("You do not have permission to post a task for this session. Only the assigned instructor or division admin can do this.");
      err.statusCode = 403;
      throw err;
    }

    if (bootcamp && sessionData.bootcamp && sessionData.bootcamp.toString() !== bootcamp.toString()) {
      const err = new Error("Session does not belong to the specified bootcamp");
      err.statusCode = 400;
      throw err;
    }
  }

  if (!bootcamp) {
    const err = new Error("Task must belong to a bootcamp. Please ensure the selected session is linked to a bootcamp.");
    err.statusCode = 400;
    throw err;
  }

  if (!division && creator.division) {
    division = creator.division;
  }

  if (!division) {
    const err = new Error("Task must belong to a division.");
    err.statusCode = 400;
    throw err;
  }

  if (!deadline) {
    const err = new Error("Deadline is required");
    err.statusCode = 400;
    throw err;
  }

  startTime = startTime || new Date();
  endTime = endTime || deadline;

  const task = await Task.create({
    title,
    description,
    projectLink,
    maxScore,
    submissionTypes,
    startTime,
    endTime,
    deadline,
    bootcamp,
    division,
    session,
    createdBy: creator._id || creator.id
  });

  const enrollments = await Enrollment.find({ bootcamp, is_active: true }).select("student");
  await Notification.insertMany(
    enrollments
      .filter((enrollment) => enrollment.student)
      .map((enrollment) => ({
        user: enrollment.student,
        title: `New Task: ${task.title}`,
        message: `A new task has been posted${session ? " for your session" : ""}. Deadline: ${new Date(deadline).toLocaleString()}.`,
        type: "TASK",
        link: "/my-tasks",
      }))
  );

  return task;
};

export const getTasks = async (user, queryData) => {
  const filter = {};

  if (queryData.bootcamp) {
    filter.bootcamp = queryData.bootcamp;
  }

  if (queryData.session) {
    filter.session = queryData.session;
  }

  if (queryData.division) {
    filter.division = queryData.division;
  }

  if (user.role === 'student') {
    const activeEnrollments = await Enrollment.find({ student: user._id || user.id, is_active: true });
    const enrolledBootcampIds = activeEnrollments.map(e => e.bootcamp);
    
    if (filter.bootcamp) {
      if (!enrolledBootcampIds.some(id => id.toString() === filter.bootcamp.toString())) {
        return []; 
      }
    } else {
      filter.bootcamp = { $in: enrolledBootcampIds };
    }
  }

  const tasks = await Task.find(filter)
    .populate("bootcamp", "name")
    .populate("division", "name")
    .populate("session", "title")
    .populate("createdBy", "email role");

  return tasks;
};

export const getTaskById = async (id) => {
  const task = await Task.findById(id)
    .populate("bootcamp", "name")
    .populate("division", "name")
    .populate("session", "title")
    .populate("createdBy", "email role");
    
  if (!task) {
    const err = new Error("Task not found");
    err.statusCode = 404;
    throw err;
  }

  return task;
};

export const updateTask = async (id, updateData) => {
  let task = await Task.findById(id);
  if (!task) {
    const err = new Error("Task not found");
    err.statusCode = 404;
    throw err;
  }

  task = await Task.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return task;
};

export const deleteTask = async (id) => {
  const task = await Task.findById(id);
  if (!task) {
    const err = new Error("Task not found");
    err.statusCode = 404;
    throw err;
  }

  await Task.findByIdAndDelete(id);
  return true;
};
