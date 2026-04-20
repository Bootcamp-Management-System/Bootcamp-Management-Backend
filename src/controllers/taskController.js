import Task from "../models/Task.js";
import Session from "../models/Session.js";

// @desc    Create a new task
export const createTask = async (req, res) => {
  try {
    const { title, description, startTime, endTime, deadline, division, session } = req.body;
    const creator = req.user;

    // RBAC: Division check (handled by checkDivisionAccess)
    
    // If it's a session-specific task, verify session belongs to same division
    if (session) {
      const sessionData = await Session.findById(session);
      if (!sessionData) return res.status(404).json({ error: "Session not found" });
      if (sessionData.division.toString() !== division.toString()) {
         return res.status(400).json({ error: "Session does not belong to theSpecified division" });
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


    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Get all tasks (with filtering)
export const getTasks = async (req, res) => {
  try {
    const filter = {};
    const { user } = req;

    // Apply division filter injected by checkDivisionAccess
    if (req.query.division) {
      filter.division = req.query.division;
    }

    // Students only see tasks in their division
    if (user.role === 'student' && user.division) {
      filter.division = user.division;
    }

    const tasks = await Task.find(filter)
      .populate("division", "name")
      .populate("session", "title")
      .populate("createdBy", "email role");

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Get single task
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("division", "name")
      .populate("session", "title")
      .populate("createdBy", "email role");

    if (!task) return res.status(404).json({ error: "Task not found" });

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Update a task
export const updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // RBAC: checkDivisionAccess middleware will already verify division match for Admins/Instructors
    // We just perform the update here
    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Delete a task
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Task removed" });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};
