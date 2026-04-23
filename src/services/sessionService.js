import Bootcamp from "../models/Bootcamp.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

export const createSession = async (sessionData) => {
  const { title, description, bootcamp, instructor, location, meetingLink, startTime, endTime } = sessionData;

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

  const bootcampExists = await Bootcamp.findById(bootcamp);
  if (!bootcampExists) {
    const err = new Error("Bootcamp not found");
    err.statusCode = 404;
    throw err;
  }
  const divisionId = bootcampExists.division;

  if (instructor) {
    const instructorExists = await User.findById(instructor);
    if (!instructorExists) {
      const err = new Error("Instructor not found");
      err.statusCode = 404;
      throw err;
    }

    // Check if user is an instructor in this division's memberships
    const membership = instructorExists.memberships.find(m => m.division.toString() === divisionId.toString());
    const isActuallyInstructor = membership && membership.isInstructor;
    const isGlobalAdmin = ["super-admin", "admin"].includes(instructorExists.role);

    if (!isActuallyInstructor && !isGlobalAdmin) {
      const err = new Error("User is not a promoted instructor for this division");
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

  conflictQuery.$or.push({
    bootcamp,
    startTime: { $lt: end },
    endTime: { $gt: start }
  });

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
    instructor,
    location,
    meetingLink,
    startTime: start,
    endTime: end,
  });

  if (instructor) {
    await User.findByIdAndUpdate(instructor, { is_Mentoring: true });
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

    const membership = instructorExists.memberships.find(m => m.division.toString() === divisionId.toString());
    const isActuallyInstructor = membership && membership.isInstructor;
    const isGlobalAdmin = ["super-admin", "admin"].includes(instructorExists.role);

    if (!isActuallyInstructor && !isGlobalAdmin) {
      const err = new Error("User is not a promoted instructor for this division");
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