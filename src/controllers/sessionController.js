import Division from "../models/Division.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

export const createSession = async (req, res) => {
  try {
    const {
      title,
      description,
      division,
      instructor,
      location,
      meetingLink,
      startTime,
      endTime,
    } = req.body;

    if (!startTime || !endTime)
      return res
        .status(400)
        .json({ error: "Start and end times are required" });

    const start = new Date(startTime);
    const end = new Date(endTime);

    const durationMs = end - start;
    if (durationMs < 30 * 60 * 1000) {
      return res
        .status(400)
        .json({ error: "Session must be at least 30 minutes long" });
    }

    const divisionExists = await Division.findById(division);
    if (!divisionExists)
      return res.status(404).json({ error: "Division not found" });

    const instructorExists = await User.findById(instructor);
    if (
      !instructorExists ||
      !["admin", "instructor"].includes(instructorExists.role)
    ) {
      return res.status(400).json({ error: "Invalid instructor/admin ID" });
    }

    // Check if the instructor/admin belongs to the division (except maybe super admin?)
    // But Super Admin wouldn't usually be assigned as a session instructor directly in this simplified logic
    if (
      instructorExists.role === "admin" &&
      instructorExists.division.toString() !== division.toString()
    ) {
      return res
        .status(400)
        .json({ error: "Admin does not belong to this division" });
    }

    // For instructors, we should also check if they are part of the division
    // Assuming Division model has an instructors array
    if (instructorExists.role === "instructor") {
      const isAssignedToDivision = divisionExists.instructors
        .map((id) => id.toString())
        .includes(instructor.toString());
      if (!isAssignedToDivision) {
        return res
          .status(400)
          .json({ error: "Instructor is not assigned to this division" });
      }
    }

    const conflictQuery = {
      $or: [
        {
          division,
          startTime: { $lt: end },
          endTime: { $gt: start }
        },
        {
          instructor,
          startTime: { $lt: end },
          endTime: { $gt: start }
        }
      ]
    };

    const conflict = await Session.findOne(conflictQuery);
    
    if (conflict) {
      return res.status(409).json({ error: "Session time conflict" });
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

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

export const getSessions = async (req, res) => {
  try {
    const filter = {};

    // Admin is restricted by division (middleware injects this into query)
    if (req.query.division) {
      filter.division = req.query.division;
    }

    // Instructor only sees their assigned sessions
    if (req.user.role === "instructor") {
      filter.instructor = req.user._id;
    }

    const sessions = await Session.find(filter)
      .populate("instructor", "email role")
      .populate("division", "name");
    res
      .status(200)
      .json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

export const deleteSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.id);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.status(200).json({ success: true, message: "Session deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};
