import mongoose from "mongoose";
import Bootcamp from "../models/Bootcamp.js";
import Session from "../models/Session.js";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";
import Notification from "../models/Notification.js";
import EmailService from "./emailService.js";

// Helper to notify students
const notifyStudents = async (session) => {
  const enrollments = await Enrollment.find({ bootcamp: session.bootcamp, is_active: true }).populate('student');
  
  const studentNotifications = enrollments.map(async (e) => {
    const student = e.student;
    if (!student) return; // Prevent crash if student account was deleted but enrollment remains
    
    // 1. In-App
    await Notification.create({
      user: student._id,
      title: `New Session: ${session.title}`,
      message: `A new session has been scheduled for ${new Date(session.startTime).toLocaleString()}.`,
      type: "SESSION",
      link: `/sessions/${session._id}`
    });

    // 2. Email + Calendar (Skip email if student is the assigned instructor)
    if (session.instructor && student._id.toString() === session.instructor.toString()) {
      return;
    }
    
    await EmailService.sendSessionNotification(student.email, session);
  });

  await Promise.all(studentNotifications);
};

// Helper to notify instructor
const notifyInstructor = async (session) => {
  if (!session.instructor) return;
  const instructor = await User.findById(session.instructor);
  
  // 1. In-App
  await Notification.create({
    user: instructor._id,
    title: `New Assignment: ${session.title}`,
    message: `You have been assigned to lead the session "${session.title}" on ${new Date(session.startTime).toLocaleString()}.`,
    type: "ASSIGNMENT",
    link: `/instructor/sessions/${session._id}`
  });

  // 2. Email + Calendar
  await EmailService.sendInstructorAssignment(instructor.email, session);
};

const getInstructorConflict = async ({ instructor, start, end, excludeSessionId }) => {
  if (!instructor || !start || !end) return null;

  const conflictFilter = {
    instructor,
    startTime: { $lt: end },
    endTime: { $gt: start },
  };

  if (excludeSessionId) {
    conflictFilter._id = { $ne: excludeSessionId };
  }

  return Session.findOne(conflictFilter);
};

const isInstructorForDivision = (user, divisionId) => {
  const targetDivision = divisionId?.toString();
  if (!user || !targetDivision) return false;

  const hasInstructorMembership = user.memberships?.some((membership) =>
    membership.division?.toString() === targetDivision && membership.isInstructor === true
  );

  const hasAssignedDivision = user.assignedDivisions?.some((division) =>
    division?.toString() === targetDivision
  );

  const hasPrimaryDivision = user.division?.toString() === targetDivision;

  return user.role === "instructor" && (hasInstructorMembership || hasAssignedDivision || hasPrimaryDivision);
};

export const createSession = async (sessionData) => {
  const { title, description, bootcamp, division, instructor, location, meetingLink, startTime, endTime } = sessionData;

  if (!startTime || !endTime) {
    const err = new Error("Start and end times are required");
    err.statusCode = 400;
    throw err;
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  const durationMs = end - start;
  if (durationMs < 30 * 60 * 1000) {
    const err = new Error("Session must be at least 30 minutes long");
    err.statusCode = 400;
    throw err;
  }

  let divisionId;
  if (bootcamp) {
    const bootcampExists = await Bootcamp.findById(bootcamp);
    if (!bootcampExists) {
      const err = new Error("Bootcamp not found");
      err.statusCode = 404;
      throw err;
    }
    divisionId = bootcampExists.division;
  } else {
    divisionId = new mongoose.Types.ObjectId(division);
  }

  if (instructor) {
    const instructorExists = await User.findById(instructor);
    if (!instructorExists) {
      const err = new Error("Instructor not found");
      err.statusCode = 404;
      throw err;
    }

    if (!isInstructorForDivision(instructorExists, divisionId)) {
      const err = new Error("Selected user is not an instructor for this division.");
      err.statusCode = 403;
      throw err;
    }

    const instructorConflict = await getInstructorConflict({ instructor, start, end });
    if (instructorConflict) {
      const err = new Error("Instructor already has a session scheduled at this date and time.");
      err.statusCode = 409;
      throw err;
    }
  }

  const conflictQuery = {
    $or: []
  };

  if (bootcamp) {
    conflictQuery.$or.push({
      bootcamp,
      startTime: { $lt: end },
      endTime: { $gt: start }
    });
  }

  if (instructor) {
    conflictQuery.$or.push({
      instructor,
      startTime: { $lt: end },
      endTime: { $gt: start }
    });
  }

  const conflict = await Session.findOne(conflictQuery);
  
  if (conflict) {
    const err = new Error("Session time conflict");
    err.statusCode = 409;
    throw err;
  }

  const session = await Session.create({
    title,
    description,
    bootcamp,
    division: divisionId,
    instructor,
    location,
    meetingLink,
    startTime: start,
    endTime: end,
  });

  // Trigger Notifications
  notifyStudents(session).catch(err => console.error("Notification failed", err));
  if (instructor) {
    notifyInstructor(session).catch(err => console.error("Instructor Notification failed", err));
  }

  return session;
};

export const getSessions = async (user, queryData) => {
  const filter = {};

  if (queryData.bootcamp) {
    filter.bootcamp = queryData.bootcamp;
  }

  if (user.role === "instructor") {
    filter.instructor = user._id;
  }

  if (user.role === "student") {
    const activeEnrollments = await Enrollment.find({ student: user._id || user.id, is_active: true }).select("bootcamp");
    filter.bootcamp = { $in: activeEnrollments.map((enrollment) => enrollment.bootcamp) };
  }

  if (queryData.division) {
    filter.division = queryData.division;
  }

  const sessions = await Session.find(filter)
    .populate("instructor", "name email role")
    .populate("bootcamp", "name")
    .populate("division", "name")
    .sort({ startTime: -1 });
  
  return sessions;
};

export const getSessionById = async (id, user) => {
  const session = await Session.findById(id)
    .populate("instructor", "name email role")
    .populate("bootcamp", "name")
    .populate("division", "name");

  if (!session) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  if (user.role === "instructor" && session.instructor?._id?.toString() !== user._id.toString()) {
    const err = new Error("You can only view sessions assigned to you.");
    err.statusCode = 403;
    throw err;
  }

  if (user.role === "student") {
    const enrollment = await Enrollment.findOne({
      student: user._id || user.id,
      bootcamp: session.bootcamp?._id || session.bootcamp,
      is_active: true,
    });

    if (!enrollment) {
      const err = new Error("You can only view sessions for bootcamps you are enrolled in.");
      err.statusCode = 403;
      throw err;
    }
  }

  return session;
};

export const updateSession = async (id, updateData, actor) => {
  const sessionToUpdate = await Session.findById(id);
  if (!sessionToUpdate) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  if (actor?.role === "instructor" && sessionToUpdate.instructor?.toString() !== (actor._id || actor.id)?.toString()) {
    const err = new Error("You can only update sessions assigned to you.");
    err.statusCode = 403;
    throw err;
  }

  if (actor?.role === "instructor") {
    const allowedInstructorFields = ["description", "location", "meetingLink", "status", "completedAt", "notifyStudents"];
    updateData = Object.fromEntries(
      Object.entries(updateData).filter(([key]) => allowedInstructorFields.includes(key))
    );
  }

  if (updateData.status === "completed" && !updateData.completedAt) {
    updateData.completedAt = new Date();
  }

  const nextStart = updateData.startTime ? new Date(updateData.startTime) : sessionToUpdate.startTime;
  const nextEnd = updateData.endTime ? new Date(updateData.endTime) : sessionToUpdate.endTime;
  const nextInstructor = updateData.instructor || sessionToUpdate.instructor;

  if (nextInstructor && nextStart && nextEnd) {
    const instructorConflict = await getInstructorConflict({
      instructor: nextInstructor,
      start: nextStart,
      end: nextEnd,
      excludeSessionId: id,
    });

    if (instructorConflict) {
      const err = new Error("Instructor already has a session scheduled at this date and time.");
      err.statusCode = 409;
      throw err;
    }
  }

  // If instructor is being updated, validate division access
  if (updateData.instructor && updateData.instructor.toString() !== sessionToUpdate.instructor?.toString()) {
    const instructorExists = await User.findById(updateData.instructor);
    const sessionBootcamp = await Bootcamp.findById(sessionToUpdate.bootcamp);
    const divisionId = sessionBootcamp.division;

    if (!isInstructorForDivision(instructorExists, divisionId)) {
      const err = new Error("Selected user is not an instructor for this division.");
      err.statusCode = 403;
      throw err;
    }

  }

  const session = await Session.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  // If instructor was changed, notify the NEW instructor
  if (updateData.instructor && updateData.instructor.toString() !== sessionToUpdate.instructor?.toString()) {
     notifyInstructor(session).catch(err => console.error("Instructor Notification failed", err));
  }

  // Send feedback prompt automatically when an instructor ends the session.
  const didCompleteSession = updateData.status === "completed" && sessionToUpdate.status !== "completed";
  const didPublishDetails = updateData.notifyStudents === true || didCompleteSession;

  if (didPublishDetails) {
    const enrollments = await Enrollment.find({ bootcamp: session.bootcamp, is_active: true }).select("student");
    const title = session.status === "completed" ? `Session ended: ${session.title}` : `Session updated: ${session.title}`;
    const message = session.status === "completed"
      ? "The instructor ended this session. Please open the session page and submit your feedback."
      : "The instructor updated the session details, resources, or meeting information.";

    await Notification.insertMany(
      enrollments
        .filter((enrollment) => enrollment.student)
        .map((enrollment) => ({
          user: enrollment.student,
          title,
          message,
          type: "SESSION",
          link: `/sessions/${session._id}`,
        }))
    );
  }

  return session;
};

export const deleteSession = async (id) => {
  const session = await Session.findById(id);
  if (!session) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  await Session.findByIdAndDelete(id);
  return session;
};

export const getAvailableInstructors = async (divisionId, currentUser, options = {}) => {
  const { startTime, endTime, sessionId } = options;
  // Find instructors explicitly connected to this division.
  const query = {
    $or: [
      {
        'memberships': {
          $elemMatch: {
            division: divisionId,
            isInstructor: true
          }
        }
      },
      { role: "instructor", assignedDivisions: divisionId },
      { role: "instructor", division: divisionId },
    ],
  };

  const instructors = await User.find(query)
  .select('name email campusId motivation dedication memberships role')
  .populate('memberships.division', 'name');

  if (!startTime || !endTime) {
    return instructors;
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return instructors;
  }

  const conflicts = await Session.find({
    instructor: { $in: instructors.map((instructor) => instructor._id) },
    startTime: { $lt: end },
    endTime: { $gt: start },
    ...(sessionId ? { _id: { $ne: sessionId } } : {}),
  }).select("instructor");

  const conflictedInstructorIds = new Set(conflicts.map((session) => session.instructor?.toString()));
  return instructors.filter((instructor) => !conflictedInstructorIds.has(instructor._id.toString()));
};
