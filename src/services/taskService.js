import Task from "../models/Task.js";
import Session from "../models/Session.js";

export const createTask = async (taskData, creator) => {
  const { title, description, startTime, endTime, deadline, bootcamp, session } = taskData;

  if (session) {
    const sessionData = await Session.findById(session);
    if (!sessionData) {
      const err = new Error("Session not found");
      err.statusCode = 404;
      throw err;
    }
    if (sessionData.bootcamp.toString() !== bootcamp.toString()) {
      const err = new Error("Session does not belong to the specified bootcamp");
      err.statusCode = 400;
      throw err;
    }
  }

  const task = await Task.create({
    title,
    description,
    startTime,
    endTime,
    deadline,
    bootcamp,
    session,
    createdBy: creator.id
  });

  return task;
};

export const getTasks = async (user, queryData) => {
  const filter = {};

  if (queryData.bootcamp) {
    filter.bootcamp = queryData.bootcamp;
  }

  // user.division check is removed for students because bootcampGuard handles filtering
  // Admins can pass bootcamp in queryData, which is handled above.

  const tasks = await Task.find(filter)
    .populate("bootcamp", "name")
    .populate("session", "title")
    .populate("createdBy", "email role");

  return tasks;
};

export const getTaskById = async (id) => {
  const task = await Task.findById(id)
    .populate("bootcamp", "name")
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