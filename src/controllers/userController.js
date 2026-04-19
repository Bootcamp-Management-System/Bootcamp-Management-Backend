import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import Division from "../models/Division.js";
import RoleHistory from "../models/RoleHistory.js";
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

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Public (for now) / Admin
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

// @desc    Promote User to a new role
// @route   PATCH /users/:id/promote
// @access  Private (super_admin or division_admin)
export const promoteUser = async (req, res) => {
  try {
    const { newRole, divisionId, reason } = req.body;
    const targetUserId = req.params.id;

    // To test without RBAC auth: mock a super_admin user as the requester.
    let requester = req.user;
    if (!requester) {
      requester = await User.findOne({ role: 'super_admin' });
      // If there's no super_admin, just fake one to prevent crashes during tests:
      if (!requester) {
        requester = {
          _id: new crypto.randomBytes(12).toString("hex"), // Fake ID
          role: 'super_admin'
        };
      }
    }

    if (!requester || !['super_admin', 'division_admin', 'admin'].includes(requester.role)) {
      return res.status(403).json({ message: "Not authorized to promote users" });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === requester._id.toString()) {
      return res.status(400).json({ message: "You cannot promote yourself" });
    }

    const oldRole = user.role;

    // 1. Promote to Instructor (Requested by Division Admin or Super Admin)
    if (newRole === 'instructor') {
      if (requester.role === 'super_admin') {
        if (oldRole !== 'student' && oldRole !== 'admin' && oldRole !== 'division_admin') {
          return res.status(400).json({ message: "Super Admin can only promote students or admins to instructor" });
        }
      } else {
        if (oldRole !== 'student') {
          return res.status(400).json({ message: "Admins can only promote students to instructor" });
        }
      }

      // Div Admin must be in the same division
      if (requester.role === 'division_admin' || requester.role === 'admin') {
        if (!user.division || user.division.toString() !== requester.division?.toString()) {
          return res.status(403).json({ message: "Cannot promote a user outside of your division" });
        }
      }

      // Generate temp credentials
      const tempPassRaw = crypto.randomBytes(8).toString('hex');
      const hashedTempPass = await bcrypt.hash(tempPassRaw, 10);

      // Generate Instructor ID
      let divCode = "GEN";
      if (user.division) {
        const div = await Division.findById(user.division);
        if (div) divCode = div.name.substring(0, 3).toUpperCase();
      }
      const count = await User.countDocuments({ role: "instructor", division: user.division });
      const instructorId = `INS-${divCode}-${String(count + 1).padStart(4, "0")}`;

      user.role = 'instructor';
      user.firstLogin = true;
      user.password = hashedTempPass; // Update main password or temp, resetting their access
      user.temporaryPassword = hashedTempPass;
      user.instructorId = instructorId;

      await user.save();

      // Create Audit Log
      await RoleHistory.create({
        userId: user._id,
        previousRole: oldRole,
        newRole: 'instructor',
        changedBy: requester._id,
        divisionId: user.division,
        reason: reason || "Promoted to instructor"
      });

      // Email would be sent here
      // await sendEmail(...)

      return res.status(200).json({
        success: true,
        message: "User promoted to instructor successfully",
        userId: user._id,
        newRole: "instructor",
        instructorId: instructorId,
        tempPassword: tempPassRaw // Return for testing
      });
    }

    // 2. Promote to Division Admin (Requested by Super Admin)
    if (newRole === 'division_admin' || newRole === 'admin') {
      if (requester.role !== 'super_admin') {
        return res.status(403).json({ message: "Only Super Admin can promote to Division Admin" });
      }

      if (['division_admin', 'super_admin', 'admin'].includes(oldRole)) {
        return res.status(400).json({ message: "User is already an admin" });
      }

      // Allow updating division during promotion or stick to existing
      const finalDivisionId = divisionId || user.division;
      if (!finalDivisionId) {
         return res.status(400).json({ message: "User must be assigned to a division to be a division admin. Provide a 'divisionId' in the request." });
      }

      const tempPassRaw = crypto.randomBytes(8).toString('hex');
      const hashedTempPass = await bcrypt.hash(tempPassRaw, 10);

      user.role = newRole; // Handle if they pass 'admin' or 'division_admin'
      user.division = finalDivisionId;
      user.firstLogin = true;
      user.password = hashedTempPass;
      user.temporaryPassword = hashedTempPass;

      await user.save();

      await RoleHistory.create({
        userId: user._id,
        previousRole: oldRole,
        newRole: newRole,
        changedBy: requester._id,
        divisionId: user.division,
        reason: reason || "Promoted to division admin"
      });

      return res.status(200).json({
        success: true,
        message: "User promoted to division admin successfully",
        userId: user._id,
        newRole: newRole,
        tempPassword: tempPassRaw // Return for testing
      });
    }

    return res.status(400).json({ message: `Invalid promotion newRole: ${newRole}` });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get currently logged in user
// @route   GET /api/v1/users/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    // req.user is set in authMiddleware
    const user = await User.findById(req.user._id).select("-password").populate("division", "name");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get single user by ID
// @route   GET /api/v1/users/:id
// @access  Public / Private (Admin)
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").populate("division", "name");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update single user
// @route   PUT /api/v1/users/:id
// @access  Private
export const updateUser = async (req, res) => {
  try {
    const { email, role, division } = req.body;
    let user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (email) user.email = email;
    if (role) user.role = role;
    if (division) user.division = division;

    await user.save();
    
    res.status(200).json({ success: true, message: "User updated successfully", data: user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Delete single user
// @route   DELETE /api/v1/users/:id
// @access  Private
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
