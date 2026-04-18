import Division from "../models/Division.js";
import User from "../models/User.js";

export const createDivision = async (req, res) => {
  try {
    const { name, description, instructors } = req.body;

    const existingDivision = await Division.findOne({ name });
    if (existingDivision) {
      return res.status(400).json({ error: "Division with this name already exists" });
    }

    if (instructors && instructors.length > 0) {
      const foundAdmins = await User.find({
        _id: { $in: instructors },
        role: "admin",
      });
      if (foundAdmins.length !== instructors.length) {
        return res.status(400).json({ error: "One or more invalid admin IDs provided" });
      }
    }

    const division = await Division.create({
      name,
      description,
      instructors: instructors || [],
    });

    res.status(201).json({ success: true, data: division });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

export const getDivisions = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'admin') {
      filter._id = req.user.division;
    }

    const divisions = await Division.find(filter).populate("instructors", "email role");
    res.status(200).json({ success: true, count: divisions.length, data: divisions });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};