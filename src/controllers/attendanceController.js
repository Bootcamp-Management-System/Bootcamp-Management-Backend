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

    // 3. Permissions check (Contextual RBAC)
    const isGlobalAdmin = ['super-admin', 'admin'].includes(marker.role);
    const isSessionInstructor = session.instructor?.toString() === marker.id.toString();

    if (!isGlobalAdmin && !isSessionInstructor) {
       return res.status(403).json({ error: "You do not have permission to mark attendance for this session. Only the assigned instructor or division admin can do this." });
    }

    if (marker.role === 'admin' && session.division.toString() !== marker.division.toString()) {
       return res.status(403).json({ error: "Admins can only mark attendance for sessions in their own division." });
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
      // Students see their own attendance
      // OR if they are an instructor for some sessions, they might want to see the whole list?
      // For now, if they are the instructor for a specific session, let them see all attendance for that session
      const isInstructorForSession = sessionId && (await Session.findById(sessionId))?.instructor?.toString() === user.id;
      
      if (isInstructorForSession) {
        filter.session = sessionId;
      } else {
        filter.student = user.id;
      }
    } else if (user.role === 'instructor' || user.role === 'student') {
       // Check sessions where this user is the instructor
       const mySessions = await Session.find({ instructor: user.id }).select('_id');
       const mySessionIds = mySessions.map(s => s._id);
       
       if (sessionId) {
         if (mySessionIds.map(id => id.toString()).includes(sessionId)) {
            filter.session = sessionId;
         } else {
            filter.student = user.id; // Fallback to seeing own attendance if not the instructor
         }
       } else {
          // If no sessionId, they see attendance for all sessions they instruct
          filter.session = { $in: mySessionIds };
       }
    }

    const attendance = await Attendance.find(filter)
      .populate("student", "email")
      .populate("session", "title startTime");

    res.status(200).json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};