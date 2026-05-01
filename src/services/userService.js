import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import Division from "../models/Division.js";
import RoleHistory from "../models/RoleHistory.js";
import EmailService from "./emailService.js";

export const createUser = async (userData, creatorUser) => {
  const { email, password, role, divisions, is_Member, name } = userData;
  
  const currentUserRole = creatorUser.role;
  const creatorDivision = creatorUser.division;

  if (currentUserRole === 'instructor' || currentUserRole === 'student') {
    const err = new Error("You do not have permission to create users.");
    err.statusCode = 403;
    throw err;
  }

  // Support both single division and multiple divisions input
  const divisionList = Array.isArray(divisions) ? divisions : (userData.division ? [userData.division] : []);

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

    // Admins can only add to their own division
    if (divisionList.length > 0 && !divisionList.includes(creatorDivision.toString())) {
      const err = new Error("Admins can only create users for their own division.");
      err.statusCode = 403;
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

  // Map divisions to memberships
  const memberships = divisionList.map(divId => ({
    division: divId,
    isMember: is_Member || role === 'admin' || role === 'instructor' ? true : false,
    isInstructor: role === 'admin' || role === 'instructor' ? true : false
  }));

  const user = await User.create({
    email,
    name,
    password: hashedPassword,
    role: role || "student",
    division: currentUserRole === 'admin' ? creatorDivision : (divisionList[0] || undefined),
    assignedDivisions: divisionList,
    memberships: memberships,
    is_Member: is_Member || false,
    firstLogin: true,
    verified: true,
    is_EmailVerified: true
  });

  // Send Welcome Email if it's a new Member import
  if (is_Member) {
    try {
      const divisionsData = await Division.find({ _id: { $in: divisionList } });
      const divisionNames = divisionsData.map(d => d.name);
      await EmailService.sendImportWelcomeEmail(email, tempPassword, name || email, divisionNames);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError.message);
    }
  }

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
    const user = await User.findById(id)
      .select("-password")
      .populate("division", "name")
      .populate("memberships.division", "name")
      .populate("assignedDivisions", "name");
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
    if (division) {
      user.division = division;

      if (user.role === "instructor") {
        const hasAssignedDivision = user.assignedDivisions.some(
          (assignedDivision) => assignedDivision.toString() === division.toString()
        );
        if (!hasAssignedDivision) {
          user.assignedDivisions.push(division);
        }

        const membership = user.memberships.find(
          (item) => item.division.toString() === division.toString()
        );

        if (membership) {
          membership.isMember = true;
          membership.isInstructor = true;
        } else {
          user.memberships.push({ division, isMember: true, isInstructor: true });
        }
      }
    }
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
    user.verified = true;
    user.is_EmailVerified = true;
    
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

    // Only generate a new password if the user doesn't have one (e.g. they were created without one)
    // or if we want to force a reset during promotion. 
    // For now, let's KEEP their existing password if they have one.
    if (!user.password) {
      const tempPassRaw = crypto.randomBytes(8).toString('hex');
      user.password = await bcrypt.hash(tempPassRaw, 10);
      user.firstLogin = true;
      promotionData.tempPassRaw = tempPassRaw;
    }

    user.role = 'admin';
    user.division = divisionId;
    user.verified = true;
    user.is_EmailVerified = true;
    user.firstLogin = false; // Allow them to use existing pass without forced change
    
    user.memberships = [{ division: divisionId, isMember: true, isInstructor: true }];
    user.assignedDivisions = [divisionId];

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

    return { user: populatedUser, tempPassRaw: promotionData.tempPassRaw };
  }

  const err = new Error(`Invalid promotion newRole: ${newRole}`);
  err.statusCode = 400;
  throw err;
};

export const demoteUser = async (targetUserId, demotionData, requester) => {
  const { newRole, reason } = demotionData;

  if (!['instructor', 'student'].includes(newRole)) {
    const err = new Error("Invalid demotion role. Can only demote to 'instructor' or 'student'.");
    err.statusCode = 400;
    throw err;
  }

  if (requester.role !== 'super-admin' && requester.role !== 'super_admin') {
    const err = new Error("Only Super Admin can demote users.");
    err.statusCode = 403;
    throw err;
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const oldRole = user.role;

  // 1. Demote from Admin to Instructor
  if (oldRole === 'admin' && newRole === 'instructor') {
    if (user.role !== 'admin') {
      const err = new Error("User is not an admin.");
      err.statusCode = 400;
      throw err;
    }

    // Keep the user as instructor in their assigned division
    // Remove admin privileges but maintain instructor status
    user.role = 'instructor';

    // Admin demotion doesn't change memberships - they remain instructors in their division
    // But we should clear the legacy division field since they're no longer division admins
    user.division = undefined;

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
      divisionId: user.memberships?.[0]?.division || null,
      reason: reason || `Demoted from Admin to Instructor`
    });

    return { user: populatedUser, message: "User demoted from Admin to Instructor successfully!" };
  }

  // 2. Demote from Instructor to Student
  if (oldRole === 'instructor' && newRole === 'student') {
    if (user.role !== 'instructor') {
      const err = new Error("User is not an instructor.");
      err.statusCode = 400;
      throw err;
    }

    // Change role to student
    user.role = 'student';

    // Remove instructor status from all memberships
    user.memberships = user.memberships.map(membership => ({
      ...membership,
      isInstructor: false
    }));

    // Clear legacy assignedDivisions
    user.assignedDivisions = [];

    // Update global mentoring flag
    user.is_Mentoring = false;

    await user.save();

    const populatedUser = await User.findById(user._id)
      .select("-password")
      .populate("division", "name")
      .populate("memberships.division", "name");

    await RoleHistory.create({
      userId: user._id,
      previousRole: oldRole,
      newRole: 'student',
      changedBy: requester._id,
      divisionId: null,
      reason: reason || `Demoted from Instructor to Student`
    });

    return { user: populatedUser, message: "User demoted from Instructor to Student successfully!" };
  }

  // 3. Demote from Admin directly to Student (if needed)
  if (oldRole === 'admin' && newRole === 'student') {
    if (user.role !== 'admin') {
      const err = new Error("User is not an admin.");
      err.statusCode = 400;
      throw err;
    }

    // Change role to student
    user.role = 'student';

    // Remove instructor status from all memberships and clear admin division
    user.memberships = user.memberships.map(membership => ({
      ...membership,
      isInstructor: false
    }));

    user.division = undefined;
    user.assignedDivisions = [];
    user.is_Mentoring = false;

    await user.save();

    const populatedUser = await User.findById(user._id)
      .select("-password")
      .populate("division", "name")
      .populate("memberships.division", "name");

    await RoleHistory.create({
      userId: user._id,
      previousRole: oldRole,
      newRole: 'student',
      changedBy: requester._id,
      divisionId: null,
      reason: reason || `Demoted from Admin to Student`
    });

    return { user: populatedUser, message: "User demoted from Admin to Student successfully!" };
  }

  const err = new Error(`Invalid demotion: cannot demote ${oldRole} to ${newRole}`);
  err.statusCode = 400;
  throw err;
};
