import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import sendEmail from "../services/emailService.js";
import Division from "../models/Division.js";

// @desc    Create new user (Admin only)
// @route   POST /api/v1/users
// @access  Private/Admin
// @desc    Get all users (Admin/Super Admin only)
export const getUsers = async (req, res) => {
  try {
    const filter = {};
    
    // Admin is restricted to their division
    if (req.user.role === 'admin') {
      filter.division = req.user.division;
    }

    const users = await User.find(filter).select("-password").populate("division", "name");
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Promote a user
export const promoteUser = async (req, res) => {
  try {
    const { userId, newRole, divisionId } = req.body;
    const adminUser = req.user;

    const userToPromote = await User.findById(userId);
    if (!userToPromote) {
      return res.status(404).json({ message: "User not found" });
    }

    // RBAC Logic for Promotion
    if (adminUser.role === 'super-admin') {
      // Super admin can do anything
      userToPromote.role = newRole || userToPromote.role;
      if (divisionId) userToPromote.division = divisionId;
    } else if (adminUser.role === 'admin') {
      if (newRole !== 'instructor') {
         return res.status(403).json({ message: "Admins can only promote students to instructors" });
      }
      if (userToPromote.role !== 'student') {
         return res.status(400).json({ message: "Only students can be promoted by admins" });
      }
      if (userToPromote.division.toString() !== adminUser.division.toString()) {
         return res.status(403).json({ message: "You can only promote students within your own division" });
      }
      // 🔥 NEW: Check if the student is verified
      if (!userToPromote.verified) {
         return res.status(403).json({ message: "Student must verify their email before they can be promoted" });
      }
      userToPromote.role = 'instructor';
    } else {
      return res.status(403).json({ message: "Insufficient permissions to promote users" });
    }

    await userToPromote.save();

    // If promoted to instructor, add to the Division instructors array
    if (userToPromote.role === 'instructor') {
      await Division.findByIdAndUpdate(userToPromote.division, {
        $addToSet: { instructors: userToPromote._id }
      });
    }

    res.status(200).json({
      success: true,
      message: `User promoted to ${userToPromote.role} and added to division records`,
      data: userToPromote
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Create new user
export const createUser = async (req, res) => {
  try {
    const { email, role, division } = req.body;
    const creator = req.user;

    // 1. Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // RBAC check for user creation
    if (creator.role === 'admin') {
       if (role && role !== 'student') {
          return res.status(403).json({ message: "Admins can only create students" });
       }
       // Ensure student is created in admin's division
       req.body.division = creator.division;
    }

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // 2. Generate a random temporary password
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 3. Create the user
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || "student",
      division: req.body.division || undefined,
      firstLogin: true,
      verified: false
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      tempPassword
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/v1/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
