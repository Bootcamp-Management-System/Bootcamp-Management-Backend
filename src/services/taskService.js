import Task from "../models/Task.js";
import Session from "../models/Session.js";

export const createTask = async (taskData, creator) => {
  const { title, description, startTime, endTime, deadline, division, session } = taskData;

  if (session) {
    const sessionData = await Session.findById(session);
    if (!sessionData) {
      const err = new Error("Session not found");
      err.statusCode = 404;
      throw err;
    }
    if (sessionData.division.toString() !== division.toString()) {
      const err = new Error("Session does not belong to the specified division");
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
    division,
    session,
    createdBy: creator.id
  });

  return task;
};

export const getTasks = async (user, queryData) => {
  const filter = {};

  if (queryData.division) {
    filter.division = queryData.division;
  }

  if (user.role === 'student' && user.division) {
    filter.division = user.division;
  }

  const tasks = await Task.find(filter)
    .populate("division", "name")
    .populate("session", "title")
    .populate("createdBy", "email role");

  return tasks;
};

export const getTaskById = async (id) => {
  const task = await Task.findById(id)
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