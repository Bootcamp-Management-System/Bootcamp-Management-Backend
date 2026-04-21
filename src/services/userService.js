import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import Division from "../models/Division.js";
import RoleHistory from "../models/RoleHistory.js";

export const createUser = async (userData, creatorUser) => {
  const { email, password, role, division, is_Member } = userData;
  const currentUserRole = creatorUser.role;
  const creatorDivision = creatorUser.division;

  if (currentUserRole === 'instructor' || currentUserRole === 'student') {
    const err = new Error("You do not have permission to create users.");
    err.statusCode = 403;
    throw err;
  }

  if (currentUserRole === 'admin') {
    if (role === 'super-admin' || role === 'admin') {
      const err = new Error("Admins cannot create other Admin or Super Admin accounts.");
      err.statusCode = 403;
      throw err;
    }

    if (!creatorDivision) {
      const err = new Error("Admin must already be assigned to a division before creating users.");
      err.statusCode = 403;
      throw err;
    }

      if (!division) {
        const err = new Error("Division ID is required when creating a user.");
        err.statusCode = 400;
        throw err;
      }

      if (division.toString() !== creatorDivision.toString()) {
        const err = new Error("Admins can only create users for their own division.");
        err.statusCode = 403;
        throw err;
      }
    }

    if (role === 'admin') {
      if (!division && currentUserRole !== 'admin') {
        const err = new Error("An Admin must be assigned a Division ID upon creation.");
        err.statusCode = 400;
        throw err;
      }
      const adminDivisionId = division || creatorDivision;
      const divisionExists = await Division.findById(adminDivisionId);
      if (!divisionExists) {
        const err = new Error("The specified Division does not exist. You must create the Division first.");
        err.statusCode = 404;
        throw err;
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error("User already exists with this email");
      err.statusCode = 400;
      throw err;
    }

    const tempPassword = password || crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || "student",
      division: currentUserRole === 'admin' ? creatorDivision : (division || undefined),
      assignedDivisions: currentUserRole === 'admin'
        ? (creatorDivision ? [creatorDivision] : [])
        : (division ? [division] : []),
      is_Member: false,
      firstLogin: true,
      verified: false
    });

    return { user, tempPassword };
  };

  export const getUsers = async () => {
    return await User.find().select("-password");
  };

  export const getUserById = async (id) => {
    const user = await User.findById(id).select("-password").populate("division", "name");
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }
    return user;
  };

  export const updateUser = async (id, updateData) => {
    const { email, role, division, is_Member } = updateData;
    let user = await User.findById(id);

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    if (email) user.email = email;
    if (role) user.role = role;
    if (division) user.division = division;
    if (is_Member !== undefined) user.is_Member = is_Member;

    await user.save();
    return user;
  };

export const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return user;
};

export const promoteUser = async (targetUserId, promotionData, requester) => {
  const { newRole, divisionId, reason, is_Member } = promotionData;

  const user = await User.findById(targetUserId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // Allow admin to explicitly set is_Member during promotion
  if (is_Member !== undefined) {
    user.is_Member = is_Member;
  }

  if (user._id.toString() === requester._id.toString()) {
    const err = new Error("You cannot promote yourself");
    err.statusCode = 400;
    throw err;
  }

  const oldRole = user.role;

  // 1. Promote to Instructor
  if (newRole === 'instructor') {
    if (requester.role === 'super-admin') {
      const err = new Error("Only an Admin can promote a student to an instructor for their division.");
      err.statusCode = 403;
      throw err;
    }

    if (oldRole !== 'student') {
      const err = new Error("Admins can only promote students to instructor.");
      err.statusCode = 400;
      throw err;
    }

    if (!user.is_Member) {
      const err = new Error("Cannot promote student: User is not marked as a verified member (is_Member = false).");
      err.statusCode = 400;
      throw err;
    }

    if (!user.verified) {
      const err = new Error("Cannot promote student: User has not verified their email.");
      err.statusCode = 400;
      throw err;
    }

    // Admins assign the instructor to *their* division (multiple assignment)
    const adminDivision = requester.division;
    if (!adminDivision) {
      const err = new Error("Admin is not assigned to a division.");
      err.statusCode = 403;
      throw err;
    }

    // Determine if we need to reset the password, maybe not if they already verified their email?
    // Let's keep the existing password.
    
    user.role = 'instructor';
    
    // Add the admin's division to the instructor's assignedDivisions
    if (!user.assignedDivisions.includes(adminDivision)) {
      user.assignedDivisions.push(adminDivision);
    }
    
    // Update primary division if it wasn't set
    if (!user.division) {
      user.division = adminDivision;
    }

    await user.save();

    await RoleHistory.create({
      userId: user._id,
      previousRole: oldRole,
      newRole: 'instructor',
      changedBy: requester._id,
      divisionId: adminDivision,
      reason: reason || `Promoted to instructor in division ${adminDivision}`
    });

    return { user, message: "Student promoted to instructor successfully!" };
  }

  // 2. Promote to Admin
  if (newRole === 'admin') {
    if (requester.role !== 'super-admin') {
      const err = new Error("Only Super Admin can promote to Admin");
      err.statusCode = 403;
      throw err;
    }

    if (['super-admin', 'admin'].includes(oldRole)) {
      const err = new Error("User is already an admin");
      err.statusCode = 400;
      throw err;
    }

    const finalDivisionId = divisionId || user.division;
    if (!finalDivisionId) {
      const err = new Error("User must be assigned to a division to be a division admin");
      err.statusCode = 400;
      throw err;
    }

    const tempPassRaw = crypto.randomBytes(8).toString('hex');
    const hashedTempPass = await bcrypt.hash(tempPassRaw, 10);

    user.role = newRole;
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

    return { user, tempPassRaw };
  }

  const err = new Error(`Invalid promotion newRole: ${newRole}`);
  err.statusCode = 400;
  throw err;
};