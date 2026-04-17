import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import sendEmail from "../services/emailService.js";

// @desc    Create new user (Admin only)
// @route   POST /api/v1/users
// @access  Private/Admin
export const createUser = async (req, res) => {
  try {
    const { email, role, division } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // 2. Generate a random temporary password (e.g., 8 bytes hex = 16 characters)
    const tempPassword = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 3. Create the user
    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || "student", // default to student if not provided
      division: division || undefined,
      firstLogin: true, // As per your requirements
      verified: false
    });

    // 4. Send email with credentials (commented out actual send for local testing speed, but it's ready)
    // await sendEmail({
    //   to: email,
    //   subject: "Welcome to BMS - Your Login Credentials",
    //   text: `Your account has been created.\nEmail: ${email}\nTemporary Password: ${tempPassword}\n\nPlease login to verify your account and change your password.`
    // });

    // 5. Send response (Returning tempPassword here so you can easily test in Postman!)
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      tempPassword // ⚠️ REMOVE THIS IN PRODUCTION - Only here for testing purposes so you don't have to check emails
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/v1/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
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
