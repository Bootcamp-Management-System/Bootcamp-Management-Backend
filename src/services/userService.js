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
      memberships: (division || creatorDivision) ? [{
        division: division || creatorDivision,
        isMember: role === 'admin' ? true : false,
        isInstructor: role === 'admin' ? true : false
      }] : [],
      is_Member: false,
      firstLogin: true,
      verified: false,
      is_EmailVerified: true // Auto-verified if created by admin
    });

    return { user, tempPassword };
  };

  export const importMembers = async (membersList) => {
    const results = [];
    for (const member of membersList) {
      const { email, name, divisions } = member;
      
      let user = await User.findOne({ email });
      const tempPassword = crypto.randomBytes(8).toString("hex");
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      if (!user) {
        user = await User.create({
          email,
          name,
          password: hashedPassword,
          role: 'student',
          is_Member: true,
          is_EmailVerified: true,
          firstLogin: true,
          memberships: divisions.map(d => ({ division: d, isMember: true }))
        });
      } else {
        // If user exists, update their membership status
        user.is_Member = true;
        divisions.forEach(divId => {
          const existing = user.memberships.find(m => m.division.toString() === divId.toString());
          if (existing) {
            existing.isMember = true;
          } else {
            user.memberships.push({ division: divId, isMember: true });
          }
        });
        await user.save();
      }
      results.push({ email, tempPassword: !user ? tempPassword : 'ALREADY_EXISTS' });
    }
    return results;
  };

  export const getMemberPool = async (query = {}) => {
    // Return all users who are marked as members (global or division-specific)
    return await User.find({ 
      $or: [
        { is_Member: true },
        { "memberships.isMember": true }
      ]
    }).select("-password").populate("memberships.division", "name");
  };

  export const getUsers = async (filters = {}) => {
    return await User.find(filters)
      .select("-password")
      .populate("division", "name")
      .populate("memberships.division", "name")
      .populate("assignedDivisions", "name");
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
    const { email, role, division, is_Member, name } = updateData;
    let user = await User.findById(id);

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    if (email) user.email = email;
    if (name) user.name = name;
    if (role) user.role = role;
    if (division) user.division = division;
    if (is_Member !== undefined) user.is_Member = is_Member;
    if (updateData.firstLogin !== undefined) user.firstLogin = updateData.firstLogin;
    if (updateData.motivation) user.motivation = updateData.motivation;
    if (updateData.dedication) user.dedication = updateData.dedication;

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

export const completeOnboarding = async (id, onboardingData) => {
  const { motivation, dedication } = onboardingData;
  const user = await User.findById(id);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  if (motivation) user.motivation = motivation;
  if (dedication) user.dedication = dedication;
  user.firstLogin = false;
  await user.save();
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

  // 1. Promote to Instructor (Admin or Super Admin Action)
  if (newRole === 'instructor') {
    let targetDivision = divisionId;

    if (requester.role === 'admin') {
      // Admins assign the instructor to *their* division
      targetDivision = requester.division;
      if (!targetDivision) {
        const err = new Error("Admin is not assigned to a division.");
        err.statusCode = 403;
        throw err;
      }
    } else if (requester.role === 'super-admin' || requester.role === 'super_admin') {
      if (!targetDivision) {
        const err = new Error("Super Admin must specify a division to promote the user to.");
        err.statusCode = 400;
        throw err;
      }
    } else {
      const err = new Error("Unauthorized to promote to instructor.");
      err.statusCode = 403;
      throw err;
    }

    // Find if user has membership in this division
    let membership = user.memberships.find(m => m.division.toString() === targetDivision.toString());
    
    if (!membership) {
       // If not a member of this division, check if they are in the pool
       if (!user.is_Member) {
         const err = new Error("User must be an existing Member before being promoted to Instructor.");
         err.statusCode = 400;
         throw err;
       }
       // Add them to this division's membership list
       user.memberships.push({ division: targetDivision, isMember: true, isInstructor: true });
    } else {
       if (!membership.isMember) {
         const err = new Error("User is in this division but not yet a verified Member.");
         err.statusCode = 400;
         throw err;
       }
       membership.isInstructor = true;
    }

    // Switch their global role to instructor for dashboard access
    user.role = 'instructor';
    
    // Add to legacy field for safety
    if (!user.assignedDivisions.includes(targetDivision)) {
      user.assignedDivisions.push(targetDivision);
    }

    await user.save();

    const populatedUser = await User.findById(user._id)
      .select("-password")
      .populate("division", "name")
      .populate("memberships.division", "name");

    await RoleHistory.create({
      userId: user._id,
      previousRole: oldRole,
      newRole: 'instructor',
      changedBy: requester._id,
      divisionId: targetDivision,
      reason: reason || `Promoted to instructor in division ${targetDivision}`
    });

    return { user: populatedUser, message: "User promoted to instructor for your division!" };
  }

  // 2. Promote to Admin (Super Admin Action)
  if (newRole === 'admin') {
    if (requester.role !== 'super-admin' && requester.role !== 'super_admin') {
      const err = new Error("Only Super Admin can promote a user to Division Admin.");
      err.statusCode = 403;
      throw err;
    }

    if (!user.is_Member) {
      const err = new Error("Only verified Members can be promoted to Division Admin. Please import them as members or accept their membership application first.");
      err.statusCode = 400;
      throw err;
    }

    if (user.role === 'admin') {
      const err = new Error("User is already an admin.");
      err.statusCode = 400;
      throw err;
    }

    if (!divisionId) {
      const err = new Error("You must specify the Division ID to which this admin will be assigned.");
      err.statusCode = 400;
      throw err;
    }

    const tempPassRaw = crypto.randomBytes(8).toString('hex');
    const hashedTempPass = await bcrypt.hash(tempPassRaw, 10);

    user.role = 'admin';
    user.division = divisionId;
    user.firstLogin = true;
    user.password = hashedTempPass;
    
    // Add/Update membership for this division
    let membership = user.memberships.find(m => m.division.toString() === divisionId.toString());
    if (membership) {
      membership.isMember = true;
      membership.isInstructor = true; // Admins are implicitly instructors for their division
    } else {
      user.memberships.push({ division: divisionId, isMember: true, isInstructor: true });
    }

    await user.save();
    
    const populatedUser = await User.findById(user._id)
      .select("-password")
      .populate("division", "name")
      .populate("memberships.division", "name");

    await RoleHistory.create({
      userId: user._id,
      previousRole: oldRole,
      newRole: 'admin',
      changedBy: requester._id,
      divisionId: divisionId,
      reason: reason || `Promoted to Admin for division ${divisionId}`
    });

    return { user: populatedUser, tempPassRaw };
  }

  const err = new Error(`Invalid promotion newRole: ${newRole}`);
  err.statusCode = 400;
  throw err;
};