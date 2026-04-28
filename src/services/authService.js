import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import EmailService from "./emailService.js";

const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });
};

export const signupUser = async (userData) => {
  const { email, password, name, campusId, motivation, dedication, division } = userData;
  
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("Email already registered");

  if (campusId) {
    const existingId = await User.findOne({ campusId });
    if (existingId) throw new Error("Campus ID already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    campusId,
    motivation,
    dedication,
    division,
    role: 'student',
    is_EmailVerified: false,
    otp: { code: otpCode, expiresAt: Date.now() + 15 * 60 * 1000 }
  });

  try {
    await EmailService.sendVerificationEmail(user.email, otpCode);
    console.log(`✅ Verification email sent to ${user.email}`);
  } catch (error) {
    console.error('❌ Email Service Error:', error.message);
    console.log(`⚠️ For testing: OTP for ${user.email} is: ${otpCode}`);
  }

  return { 
    message: "Signup successful. Please verify your email to continue.",
    otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined // Expose OTP in dev mode for easy testing
  };
};

export const verifyOtp = async (email, otp, newPassword) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  if (!user.otp || user.otp.code !== otp || user.otp.expiresAt < Date.now()) {
    throw new Error("Invalid or expired OTP");
  }

  if (newPassword) {
    user.password = await bcrypt.hash(newPassword, 12);
  }
  
  user.otp = undefined;
  user.is_EmailVerified = true;
  user.verified = true; // backward compatibility
  await user.save();

  const token = generateToken(user._id, user.tokenVersion || 0);
  const refreshToken = generateRefreshToken(user._id);

  return { 
    message: "Account verified successfully.",
    token,
    refreshToken,
    user: { 
      id: user._id, 
      role: user.role, 
      name: user.name,
      division: user.division,
      firstLogin: user.firstLogin
    }
  };
};

export const resendOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  if (user.is_EmailVerified) throw new Error("User is already verified");

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  user.otp = { code: otpCode, expiresAt: Date.now() + 15 * 60 * 1000 };
  await user.save();

  try {
    await EmailService.sendVerificationEmail(user.email, otpCode);
    console.log(`✅ Verification email resent to ${user.email}`);
  } catch (error) {
    console.error('❌ Email Service Error:', error.message);
    console.log(`⚠️ For testing: OTP for ${user.email} is: ${otpCode}`);
  }

  return { 
    message: "OTP sent successfully. Please check your email.",
    otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined // Expose OTP in dev mode
  };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).populate('division');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid email or password");
  }

  if (!user.is_EmailVerified) {
    throw new Error("Please verify your email address before logging in.");
  }

  const token = generateToken(user._id, user.tokenVersion || 0);
  const refreshToken = generateRefreshToken(user._id);

  const isGlobalMember = user.memberships.some(m => m.isMember);
  const isGlobalInstructor = user.memberships.some(m => m.isInstructor);

  return {
    token,
    refreshToken,
    user: { 
      id: user._id, 
      role: user.role, 
      name: user.name,
      division: user.division,
      memberships: user.memberships,
      isMember: isGlobalMember,
      isInstructor: isGlobalInstructor,
      firstLogin: user.firstLogin
    }
  };
};

export const googleLogin = async (googleToken) => {
  // Mocked for brevity
  const email = "google@example.com"; 
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      password: crypto.randomBytes(16).toString("hex"),
      role: "student",
      is_EmailVerified: true,
      verified: true,
    });
  }
  const token = generateToken(user._id, user.tokenVersion || 0);
  const refreshToken = generateRefreshToken(user._id);
  return { token, refreshToken, user: { id: user._id, role: user.role, firstLogin: user.firstLogin } };
};

export const logoutUser = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
  }
  return { message: "Logged out successfully" };
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("No user found with this email address");

  const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOTP = {
    code: resetOtp,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  };
  await user.save();

  await EmailService.sendPasswordResetOTP(user.email, resetOtp);
  return { success: true, message: "Password reset code sent to your email." };
};

export const resetPassword = async (email, otp, newPassword) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  if (!user.resetOTP || user.resetOTP.code !== otp || user.resetOTP.expiresAt < Date.now()) {
    throw new Error("Invalid or expired reset code");
  }

  // Hash new password
  user.password = await bcrypt.hash(newPassword, 12);
  
  // Clear reset OTP fields
  user.resetOTP = undefined;
  
  // Increment token version to invalidate all current sessions for security
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  
  await user.save();

  return { success: true, message: "Password has been reset successfully. You can now log in with your new password." };
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error("Incorrect current password");

  user.password = await bcrypt.hash(newPassword, 12);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  return { message: "Password changed successfully" };
};