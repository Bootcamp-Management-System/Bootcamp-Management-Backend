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
      link: `/dashboard/sessions/${session._id}`
    });

    // 2. Email + Calendar
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
    link: `/dashboard/sessions/${session._id}`
  });

  // 2. Email + Calendar
  await EmailService.sendInstructorAssignment(instructor.email, session);
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

    // Ensure the assigned user is a division instructor, a global instructor, or an admin
    const isDivisionInstructor = instructorExists.memberships.some(m => 
      m.division.toString() === divisionId.toString() && m.isInstructor === true
    );
    const isGlobalInstructor = instructorExists.role === 'instructor';
    const isGlobalAdmin = ["super-admin", "admin"].includes(instructorExists.role);

    if (!isDivisionInstructor && !isGlobalInstructor && !isGlobalAdmin) {
      const err = new Error("Selected user is not an authorized instructor for this session.");
      err.statusCode = 403;
      throw err;
    }

    if (instructorExists.is_Mentoring) {
      const err = new Error("Instructor is currently assigned to another active session (Conflict)");
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

  if (instructor) {
    await User.findByIdAndUpdate(instructor, { is_Mentoring: true });
  }

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

  const sessions = await Session.find(filter)
    .populate("instructor", "email role")
    .populate("bootcamp", "name");
  
  return sessions;
};

export const updateSession = async (id, updateData) => {
  const sessionToUpdate = await Session.findById(id);
  if (!sessionToUpdate) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  // If instructor is being updated, validate division and mentoring status
  if (updateData.instructor && updateData.instructor.toString() !== sessionToUpdate.instructor?.toString()) {
    const instructorExists = await User.findById(updateData.instructor);
    const sessionBootcamp = await Bootcamp.findById(sessionToUpdate.bootcamp);
    const divisionId = sessionBootcamp.division;

    // Ensure the assigned user is a division instructor, a global instructor, or an admin
    const isDivisionInstructor = instructorExists.memberships.some(m => 
      m.division.toString() === divisionId.toString() && m.isInstructor === true
    );
    const isGlobalInstructor = instructorExists.role === 'instructor';
    const isGlobalAdmin = ["super-admin", "admin"].includes(instructorExists.role);

    if (!isDivisionInstructor && !isGlobalInstructor && !isGlobalAdmin) {
      const err = new Error("Selected user is not an authorized instructor for this session.");
      err.statusCode = 403;
      throw err;
    }

    if (instructorExists.is_Mentoring) {
      const err = new Error("Instructor is currently assigned to another active session (Conflict)");
      err.statusCode = 409;
      throw err;
    }

    // Release old instructor
    if (sessionToUpdate.instructor) {
      await User.findByIdAndUpdate(sessionToUpdate.instructor, { is_Mentoring: false });
    }
    // Lock new instructor
    await User.findByIdAndUpdate(updateData.instructor, { is_Mentoring: true });
  }

  const session = await Session.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  // If instructor was changed, notify the NEW instructor
  if (updateData.instructor && updateData.instructor.toString() !== sessionToUpdate.instructor?.toString()) {
     notifyInstructor(session).catch(err => console.error("Instructor Notification failed", err));
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

  if (session.instructor) {
    await User.findByIdAndUpdate(session.instructor, { is_Mentoring: false });
  }

  await Session.findByIdAndDelete(id);
  return session;
};

export const getAvailableInstructors = async (divisionId, currentUser) => {
  // Find division instructors, global instructors, or the admin themselves
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
      { role: 'instructor' },
      { _id: currentUser._id }
    ],
    is_Mentoring: { $ne: true } // Not currently assigned to another session
  };

  const instructors = await User.find(query)
  .select('name email campusId motivation dedication memberships role')
  .populate('memberships.division', 'name');

  return instructors;
};