import Attendance from "../models/Attendance.js";
import Session from "../models/Session.js";

export const checkIn = async (req, res) => {
  try {
    const { session: sessionId, studentId, note } = req.body;
    const marker = req.user;

    if (!sessionId) return res.status(400).json({ error: "Session ID is required" });
    if (!studentId) return res.status(400).json({ error: "Student ID is required" });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    // Authorization checks
    if (marker.role === 'admin') {
      if (session.division.toString() !== marker.division.toString()) {
        return res.status(403).json({ error: "You can only perform check-in for sessions in your division" });
      }
    } else if (marker.role === 'instructor') {
      if (session.instructor.toString() !== marker.id.toString()) {
        return res.status(403).json({ error: "You can only perform check-in for your own sessions" });
      }
    } else if (marker.role !== 'super-admin') {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

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

export const markAttendance = async (req, res) => {
  try {
    const { studentId, sessionId, status, note } = req.body;
    const marker = req.user;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    // 2. Window Check: Only allow marking/editing within 24 hours of session end
    const now = new Date();
    const sessionEnd = new Date(session.endTime);
    const limit = 24 * 60 * 60 * 1000; // 24 hours in MS

    if (now - sessionEnd > limit) {
      return res.status(400).json({ error: "The 24-hour window for marking attendance for this session has closed." });
    }

    // 3. Permissions check
    if (marker.role === 'admin') {
      if (session.division.toString() !== marker.division.toString()) {
        return res.status(403).json({ error: "You can only mark attendance for sessions in your division" });
      }
    } else if (marker.role === 'instructor') {
      if (session.instructor.toString() !== marker.id.toString()) {
        return res.status(403).json({ error: "You can only mark attendance for your own sessions" });
      }
    } else if (marker.role !== 'super-admin') {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const attendance = await Attendance.findOneAndUpdate(
      { student: studentId, session: sessionId },
      { status, note, checkInTime: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const user = req.user;
    const filter = {};

    if (sessionId) filter.session = sessionId;

    if (user.role === 'student') {
      filter.student = user.id;
    } else if (user.role === 'instructor') {
       const mySessions = await Session.find({ instructor: user.id }).select('_id');
       filter.session = { $in: mySessions.map(s => s._id) };
    } else if (user.role === 'admin') {
       const divSessions = await Session.find({ division: user.division }).select('_id');
       filter.session = { $in: divSessions.map(s => s._id) };
    }

    const attendance = await Attendance.find(filter)
      .populate("student", "email")
      .populate("session", "title startTime");

    res.status(200).json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};
