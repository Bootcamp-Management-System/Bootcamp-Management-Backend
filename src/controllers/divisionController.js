import * as divisionService from "../services/divisionService.js";

/**
 * @desc    Create a new division
 * @route   POST /api/divisions
 */
export const createDivision = async (req, res) => {
  try {
    const division = await divisionService.createDivision(req.body);
    res.status(201).json({ success: true, data: division });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

/**
 * @desc    Get all divisions (Filtered by RBAC for admins)
 * @route   GET /api/divisions
 */
export const getDivisions = async (req, res) => {
  try {
    const divisions = await divisionService.getDivisions(req.user);
    res.status(200).json({ success: true, count: divisions.length, data: divisions });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

/**
 * @desc    Update division details (name/description only)
 * @route   PATCH /api/divisions/:id
 */
export const updateDivision = async (req, res) => {
  try {
    const division = await divisionService.updateDivision(req.params.id, req.body);
    res.status(200).json({ success: true, message: "Division updated successfully", data: division });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

/**
 * @desc    Delete a division
 * @route   DELETE /api/divisions/:id
 */
export const deleteDivision = async (req, res) => {
  try {
    await divisionService.deleteDivision(req.params.id);
    res.status(200).json({ success: true, message: "Division deleted successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

/**
 * @desc    Get all users belonging to a specific division
 * @route   GET /api/divisions/:divisionId/users
 */
export const getUsersByDivision = async (req, res) => {
  try {
    const users = await divisionService.getUsersByDivision(req.params.divisionId);
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};
