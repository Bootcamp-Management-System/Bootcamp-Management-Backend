import * as taskService from "../services/taskService.js";
import { notifyDivision } from "../services/notificationService.js";

// @desc    Create a new task
export const createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.body, req.user);
    res.status(201).json({ success: true, data: task });

    // Notify division members about the new task
    notifyDivision({
      senderId: req.user.id,
      divisionId: task.division,
      title: "New Task Assigned",
      message: `A new task "${task.title}" has been assigned to your division. Deadline: ${new Date(task.deadline).toLocaleString()}`,
      type: "task",
      link: `/tasks/${task._id}`,
      requester: req.user
    }).catch(err => console.error("Notification Error:", err));
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Get all tasks (with filtering)
export const getTasks = async (req, res) => {
  try {
    const tasks = await taskService.getTasks(req.user, req.query);
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Get single task
export const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Update a task
export const updateTask = async (req, res) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Delete a task
export const deleteTask = async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id);
    res.status(200).json({ success: true, message: "Task removed" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};
