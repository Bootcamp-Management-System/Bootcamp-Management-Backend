import Division from "../models/Division.js";
import User from "../models/User.js";

/**
 * @desc    Create a new division
 * @route   POST /api/divisions
 */
export const createDivision = async (req, res) => {
  try {
    const { name, description, instructors } = req.body;

    const existingDivision = await Division.findOne({ name });
    if (existingDivision) {
      return res.status(400).json({ error: "Division with this name already exists" });
    }

    // Verify that provided instructor IDs actually exist and are admins
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

/**
 * @desc    Get all divisions (Filtered by RBAC for admins)
 * @route   GET /api/divisions
 */
export const getDivisions = async (req, res) => {
  try {
    const filter = {};

    // RBAC: If user is an admin, restrict them to seeing only their own division
    if (req.user.role === 'admin' && req.user.division) {
      filter._id = req.user.division;
    }

    const divisions = await Division.find(filter).populate("instructors", "email role");
    res.status(200).json({ success: true, count: divisions.length, data: divisions });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

/**
 * @desc    Update division details (name/description only)
 * @route   PATCH /api/divisions/:id
 */
export const updateDivision = async (req, res) => {
  try {
    const allowedUpdates = ["name", "description"];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: "Invalid updates! Only 'name' and 'description' are allowed." });
    }

    let division = await Division.findById(req.params.id);

    if (!division) {
      return res.status(404).json({ error: "Division not found" });
    }

    // Check for name uniqueness if name is being changed
    if (req.body.name && req.body.name !== division.name) {
      const existingDivision = await Division.findOne({ name: req.body.name });
      if (existingDivision) {
        return res.status(400).json({ error: "Division with this name already exists" });
      }
      division.name = req.body.name;
    }

    if (req.body.description !== undefined) {
      division.description = req.body.description;
    }

    await division.save();

    res.status(200).json({
      success: true,
      message: "Division updated successfully",
      data: division
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

/**
 * @desc    Delete a division
 * @route   DELETE /api/divisions/:id
 */
export const deleteDivision = async (req, res) => {
  try {
    const division = await Division.findByIdAndDelete(req.params.id);

    if (!division) {
      return res.status(404).json({ error: "Division not found" });
    }

    res.status(200).json({ success: true, message: "Division deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

/**
 * @desc    Get all users belonging to a specific division
 * @route   GET /api/divisions/:divisionId/users
 */
export const getUsersByDivision = async (req, res) => {
  try {
    const { divisionId } = req.params;

    const users = await User.find({ division: divisionId }).select(
      "_id name email role division"
    );

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};
