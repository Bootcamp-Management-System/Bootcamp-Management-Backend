import jwt from "jsonwebtoken";
import Attendance from "../models/Attendance.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import Session from "../models/Session.js";

const ATTENDANCE_STATUSES = ["Present", "Absent", "Late", "Excused"];
const ATTENDANCE_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const ensureAttendanceEditor = (session, user) => {
  const isGlobalAdmin = ["super-admin", "admin"].includes(user.role);
  const isSessionInstructor = session.instructor?.toString() === user.id.toString();

  if (!isGlobalAdmin && !isSessionInstructor) {
    const err = new Error("You do not have permission to mark attendance for this session.");
    err.statusCode = 403;
    throw err;
  }

  if (user.role === "admin" && session.division.toString() !== user.division.toString()) {
    const err = new Error("Admins can only mark attendance for sessions in their own division.");
    err.statusCode = 403;
    throw err;
  }
};

const ensureAttendanceWindowOpen = (session) => {
  const sessionEnd = new Date(session.endTime);
  if (Date.now() - sessionEnd.getTime() > ATTENDANCE_EDIT_WINDOW_MS) {
    const err = new Error("The 24-hour window for marking attendance for this session has closed.");
    err.statusCode = 400;
    throw err;
  }
};

// @desc    Generate a rotating 20-second token for attendance (Instructor only)
// @route   GET /api/v1/attendance/qr-token/:sessionId
export const generateAttendanceQR = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);

    if (!session) return res.status(404).json({ error: "Session not found" });

    // Check if requester is the assigned instructor or admin
    const isGlobalAdmin = ["super-admin", "admin"].includes(req.user.role);
    const isSessionInstructor = session.instructor?.toString() === req.user.id.toString();

    if (!isGlobalAdmin && !isSessionInstructor) {
      return res.status(403).json({ error: "Only the assigned instructor or admin can generate the attendance QR." });
    }

    // Generate short-lived token (expires in 20 seconds)
    const token = jwt.sign(
      { sessionId, type: "attendance_qr" },
      process.env.JWT_QR_SECRET,
      { expiresIn: "20s" }
    );

    res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Mark attendance via QR Scan (Student)
// @route   POST /api/v1/attendance/scan
export const scanQRCode = async (req, res) => {
  try {
    const { token } = req.body;
    const studentId = req.user.id;

    if (!token) return res.status(400).json({ error: "QR Token is required" });

    // 1. Verify Token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_QR_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Attendance code expired or invalid. Please scan the current code on the instructor screen." });
    }

    const { sessionId } = decoded;

    // 2. Fetch Session
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session no longer exists" });

    // 3. Prevent Double Attendance
    const existingAttendance = await Attendance.findOne({ student: studentId, session: sessionId });
    if (existingAttendance) {
      return res.status(409).json({ error: "You have already been marked for this session" });
    }

    const minutesAfterStart = (Date.now() - new Date(session.startTime).getTime()) / (60 * 1000);
    const status = minutesAfterStart > 10 ? "Late" : "Present";

    // 4. Mark Present/Late
    const attendance = await Attendance.create({
      student: studentId,
      session: sessionId,
      checkInTime: new Date(),
      status,
      note: "Marked via Secure QR Scan"
    });

    res.status(201).json({ success: true, message: "Attendance marked successfully!", data: attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { studentId, sessionId, status, note } = req.body;
    const marker = req.user;

    if (!ATTENDANCE_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${ATTENDANCE_STATUSES.join(", ")}` });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const enrollment = await Enrollment.findOne({
      student: studentId,
      bootcamp: session.bootcamp,
      is_active: true,
    });

    if (!enrollment) {
      return res.status(400).json({ error: "Attendance can only be marked for students enrolled in this session's bootcamp." });
    }

    // 2. Window Check: Only allow marking/editing within 24 hours of session end
    ensureAttendanceWindowOpen(session);

    // 3. Permissions check (Contextual RBAC)
    ensureAttendanceEditor(session, marker);

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

export const submitAttendance = async (req, res) => {
  try {
    const { sessionId, records = [] } = req.body;
    const marker = req.user;

    if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: "At least one attendance record is required" });
    }

    const session = await Session.findById(sessionId).populate("bootcamp", "name");
    if (!session) return res.status(404).json({ error: "Session not found" });

    ensureAttendanceWindowOpen(session);
    ensureAttendanceEditor(session, marker);

    const enrollments = await Enrollment.find({
      bootcamp: session.bootcamp?._id || session.bootcamp,
      is_active: true,
    }).select("student");
    const enrolledStudentIds = new Set(enrollments.map((enrollment) => enrollment.student?.toString()).filter(Boolean));

    const submitted = [];
    for (const record of records) {
      const studentId = record.studentId?.toString();
      if (!studentId || !enrolledStudentIds.has(studentId)) continue;
      if (!ATTENDANCE_STATUSES.includes(record.status)) {
        return res.status(400).json({ error: `Status must be one of: ${ATTENDANCE_STATUSES.join(", ")}` });
      }

      const attendance = await Attendance.findOneAndUpdate(
        { student: studentId, session: sessionId },
        {
          status: record.status,
          note: record.note || "",
          checkInTime: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).populate("student", "name email campusId");

      submitted.push(attendance);
    }

    if (submitted.length > 0) {
      await Notification.insertMany(
        submitted.map((record) => ({
          user: record.student._id || record.student,
          title: `Attendance submitted: ${session.title}`,
          message: `Your attendance for ${session.bootcamp?.name || "the bootcamp"} has been recorded as ${record.status}.`,
          type: "SESSION",
          link: `/sessions/${session._id}`,
        }))
      );
    }

    res.status(200).json({ success: true, count: submitted.length, data: submitted });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

export const getAttendance = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const user = req.user;
    const filter = {};

    if (sessionId) filter.session = sessionId;
    let session = null;

    if (user.role === 'student') {
      // Students see their own attendance
      // OR if they are an instructor for some sessions, they might want to see the whole list?
      // For now, if they are the instructor for a specific session, let them see all attendance for that session
      session = sessionId ? await Session.findById(sessionId) : null;
      const isInstructorForSession = session?.instructor?.toString() === user.id;
      
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
      .populate("student", "name email campusId")
      .populate("session", "title startTime");

    let students = [];

    if (sessionId && user.role !== "student") {
      session = session || await Session.findById(sessionId);

      if (session) {
        const isGlobalAdmin = ["super-admin", "admin"].includes(user.role);
        const isSessionInstructor = session.instructor?.toString() === user.id;

        if (isGlobalAdmin || isSessionInstructor) {
          const enrollments = await Enrollment.find({
            bootcamp: session.bootcamp,
            is_active: true,
          })
            .populate("student", "name email campusId")
            .sort("createdAt");

          students = enrollments
            .filter((enrollment) => enrollment.student)
            .map((enrollment) => enrollment.student);
        }
      }
    }

    res.status(200).json({ success: true, count: attendance.length, data: attendance, students });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};
