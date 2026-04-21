import Division from "../models/Division.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

export const createSession = async (sessionData) => {
  const { title, description, division, instructor, location, meetingLink, startTime, endTime } = sessionData;

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

  const divisionExists = await Division.findById(division);
  if (!divisionExists) {
    const err = new Error("Division not found");
    err.statusCode = 404;
    throw err;
  }

  if (instructor) {
    const instructorExists = await User.findById(instructor);
    if (!instructorExists || !["admin", "instructor"].includes(instructorExists.role)) {
      const err = new Error("Invalid instructor/admin ID");
      err.statusCode = 400;
      throw err;
    }

    if (instructorExists.role === "admin" && instructorExists.division && instructorExists.division.toString() !== division.toString()) {
      const err = new Error("Admin does not belong to this division");
      err.statusCode = 400;
      throw err;
    }

    if (instructorExists.role === "instructor") {
      const isAssignedToDivision = instructorExists.assignedDivisions
        .map((id) => id.toString())
        .includes(division.toString());
      if (!isAssignedToDivision) {
        const err = new Error("Instructor is not assigned to this division");
        err.statusCode = 400;
        throw err;
      }
    }
  }

  const conflictQuery = {
    $or: []
  };

  conflictQuery.$or.push({
    division,
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
    division,
    instructor,
    location,
    meetingLink,
    startTime: start,
    endTime: end,
  });

  return session;
};

export const getSessions = async (user, queryData) => {
  const filter = {};

  if (queryData.division) {
    filter.division = queryData.division;
  }

  if (user.role === "instructor") {
    filter.instructor = user._id;
  }

  const sessions = await Session.find(filter)
    .populate("instructor", "email role")
    .populate("division", "name");
  
  return sessions;
};

export const updateSession = async (id, updateData) => {
  const sessionToUpdate = await Session.findById(id);
  if (!sessionToUpdate) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  // If instructor is being updated, validate division
  if (updateData.instructor) {
    const instructorExists = await User.findById(updateData.instructor);
    if (!instructorExists || !["admin", "instructor"].includes(instructorExists.role)) {
      const err = new Error("Invalid instructor/admin ID");
      err.statusCode = 400;
      throw err;
    }

    const sessionDivStr = sessionToUpdate.division.toString();
    
    if (instructorExists.role === "admin" && instructorExists.division && instructorExists.division.toString() !== sessionDivStr) {
      const err = new Error("Admin does not belong to this division");
      err.statusCode = 400;
      throw err;
    }

    if (instructorExists.role === "instructor") {
      const isAssignedToDivision = instructorExists.assignedDivisions
        .map((did) => did.toString())
        .includes(sessionDivStr);
      if (!isAssignedToDivision) {
        const err = new Error("Instructor is not assigned to this division");
        err.statusCode = 400;
        throw err;
      }
    }
  }

  const session = await Session.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  return session;
};

export const deleteSession = async (id) => {
  const session = await Session.findByIdAndDelete(id);

  if (!session) {
    const err = new Error("Session not found");
    err.statusCode = 404;
    throw err;
  }

  return session;
};