import * as sessionService from "../services/sessionService.js";

export const createSession = async (req, res) => {
  try {
    const session = await sessionService.createSession(req.body);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

export const getSessions = async (req, res) => {
  try {
    const sessions = await sessionService.getSessions(req.user, req.query);
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

export const getSessionById = async (req, res) => {
  try {
    const session = await sessionService.getSessionById(req.params.id, req.user);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    await sessionService.deleteSession(req.params.id);
    res.status(200).json({ success: true, message: "Session deleted successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

export const updateSession = async (req, res) => {
  try {
    const session = await sessionService.updateSession(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

export const assignInstructor = async (req, res) => {
  try {
    const { instructorId } = req.body;
    if (!instructorId) return res.status(400).json({ error: "instructorId is required" });
    const session = await sessionService.updateSession(req.params.id, { instructor: instructorId }, req.user);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

export const getAvailableInstructors = async (req, res) => {
  try {
    const { divisionId } = req.params;
    if (!divisionId) return res.status(400).json({ error: "divisionId is required" });

    const instructors = await sessionService.getAvailableInstructors(divisionId, req.user, req.query);
    res.status(200).json({ success: true, count: instructors.length, data: instructors });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};
