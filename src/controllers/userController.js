import * as userService from "../services/userService.js";

// @desc    Bulk Import Members (Super Admin only)
// @route   POST /api/v1/users/import-members
// @access  Private/SuperAdmin
export const importMembers = async (req, res) => {
  try {
    const { members } = req.body;
    if (!members || !Array.isArray(members)) {
      return res.status(400).json({ message: "Invalid members list format" });
    }
    const results = await userService.importMembers(members);
    res.status(201).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Global Member Pool (Admins only)
// @route   GET /api/v1/users/pool
// @access  Private/Admin
export const getMemberPool = async (req, res) => {
  try {
    const pool = await userService.getMemberPool();
    res.status(200).json({ success: true, count: pool.length, data: pool });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new user (Admin/Super Admin only)
// @route   POST /api/v1/users
// @access  Private/Admin
export const createUser = async (req, res) => {
  try {
    const result = await userService.createUser(req.body, req.user);
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: result.user._id,
        email: result.user.email,
        role: result.user.role
      },
      tempPassword: result.tempPassword
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Public (for now) / Admin
export const getUsers = async (req, res) => {
  try {
    const users = await userService.getUsers();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Promote User to a new role
// @route   PATCH /users/:id/promote
// @access  Private (super-admin or admin)
export const promoteUser = async (req, res) => {
  try {
    const result = await userService.promoteUser(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: `User promoted to ${result.user.role} successfully`,
      userId: result.user._id,
      newRole: result.user.role,
      tempPassword: result.tempPassRaw 
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Get currently logged in user
// @route   GET /api/v1/users/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Get single user by ID
// @route   GET /api/v1/users/:id
// @access  Public / Private (Admin)
export const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Update single user
// @route   PUT /api/v1/users/:id
// @access  Private
export const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, message: "User updated successfully", data: user });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};

// @desc    Delete single user
// @route   DELETE /api/v1/users/:id
// @access  Private
export const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message || "Server Error" });
  }
};
