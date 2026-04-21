import Attendance from "../models/Attendance.js";
import Session from "../models/Session.js";
import Division from "../models/Division.js";

// @desc    Mark attendance for a session
export const markAttendance = async (session_id, studentData, user) => {
  const { student_id, status, notes } = studentData;

  // Verify that the session exists
  const session = await Session.findById(session_id);
  if (!session) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  // Instructor/Admin Check: Ensure they are allowed to mark attendance for this session.
  // We assume the checkDivisionAccess middleware handled broad division checks,
  // but this is a secondary verification for the exact session.
  if (user.role === 'admin' && session.division.toString() !== user.division.toString()) {
     const err = new Error("You can only mark attendance for sessions in your assigned division.");
     err.statusCode = 403;
     throw err;
  }
  
  if (user.role === 'instructor' && session.instructor.toString() !== user._id.toString()) {
     const err = new Error("You can only mark attendance for your own sessions.");
     err.statusCode = 403;
     throw err;
  }

  const existingRecord = await Attendance.findOne({ session: session_id, student: student_id });

  if (existingRecord) {
    existingRecord.status = status || existingRecord.status;
    existingRecord.notes = notes || existingRecord.notes;
    await existingRecord.save();
    return existingRecord;
  }

  const attendance = await Attendance.create({
    session: session_id,
    student: student_id,
    status,
    notes,
    markedBy: user._id
  });

  return attendance;
};

// @desc    Get attendance for a specific session
export const getSessionAttendance = async (session_id, division_id) => {
  const query = { session: session_id };

  if (division_id) {
    const session = await Session.findById(session_id);
    if (session && session.division.toString() !== division_id) {
        const err = new Error("You are not authorized to view the attendance of this session");
        err.statusCode = 403;
        throw err;
    }
  }

  const attendance = await Attendance.find(query)
    .populate('student', 'email name')
    .populate('markedBy', 'email role');

  return attendance;
};

// @desc    Get user's own attendance records (Students)
export const getMyAttendance = async (user) => {
  const attendance = await Attendance.find({ student: user._id })
    .populate('session', 'title startTime')
    .sort('-createdAt');

  return attendance;
};