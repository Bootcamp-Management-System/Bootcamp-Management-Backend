import Attendance from "../models/Attendance.js";
import Session from "../models/Session.js";

export const checkIn = async (req, res) => {
  try {
    const { session: sessionId, note } = req.body;
    const studentId = req.user.id;

    if (!sessionId) return res.status(400).json({ error: "Session ID is required" });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const existingAttendance = await Attendance.findOne({ student: studentId, session: sessionId });
    if (existingAttendance) {
      return res.status(409).json({ error: "Attendance already recorded for this session" });
    }

    const checkInTime = new Date();
    const sessionStart = new Date(session.startTime);

    const diffMs = checkInTime - sessionStart;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    let status = "Present";
    if (diffMins > 10) {
      status = "Late";
    }

    const attendance = await Attendance.create({
      student: studentId,
      session: sessionId,
      checkInTime,
      status,
      note
    });

    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};