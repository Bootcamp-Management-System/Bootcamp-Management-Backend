import Session from "../models/Session.js";
import Division from "../models/Division.js";
import User from "../models/User.js";

export const createSession = async (req, res) => {
  try {
    const { title, description, division, instructor, location, meetingLink, startTime, endTime } = req.body;

    if (!startTime || !endTime) return res.status(400).json({ error: "Start and end times are required" });

    const start = new Date(startTime);
    const end = new Date(endTime);

    const durationMs = end - start;
    if (durationMs < 30 * 60 * 1000) {
      return res.status(400).json({ error: "Session must be at least 30 minutes long" });
    }

    const divisionExists = await Division.findById(division);
    if (!divisionExists) return res.status(404).json({ error: "Division not found" });

    const instructorExists = await User.findById(instructor);
    if (!instructorExists || instructorExists.role !== "admin") {
      return res.status(400).json({ error: "Invalid admin ID" });
    }

    const isAdminAssigned = divisionExists.instructors
      .map((id) => id.toString())
      .includes(instructor.toString());
    if (!isAdminAssigned) {
      return res.status(400).json({ error: "Admin is not assigned to this division" });
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
      title, description, division, instructor, location, meetingLink, startTime: start, endTime: end
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate("instructor", "email role")
      .populate("division", "name");
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};