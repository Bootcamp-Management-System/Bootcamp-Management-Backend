import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import sendEmail from "./emailService.js";

const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "24h",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (user.firstLogin || !user.verified) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = { code: otpCode, expiresAt: Date.now() + 10 * 60 * 1000 };
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Account Verification Required",
      text: `Welcome back. Please verify your account to continue. Your OTP is ${otpCode}. It expires in 10 minutes.`,
    });
    
    return { verificationRequired: true, message: "Verification required. OTP sent to email." };
  }

  const token = generateToken(user._id, user.tokenVersion || 0);
  const refreshToken = generateRefreshToken(user._id);

  return {
    verificationRequired: false,
    token,
    refreshToken,
    user: { id: user._id, role: user.role, division: user.division }
  };
};

export const verifyOtp = async (email, otp, newPassword) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (!user.otp || user.otp.code !== otp || user.otp.expiresAt < Date.now()) {
    const error = new Error("Invalid or expired OTP");
    error.statusCode = 400;
    throw error;
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = undefined;
  user.firstLogin = false;
  user.verified = true;
  await user.save();

  return { message: "Password setup successful. You can now log in." };
};

export const googleLogin = async (googleToken) => {
  // Decode googleToken, extract email and name (mocked here)
  // const decoded = await verifyGoogleToken(googleToken);
  const email = "google@example.com"; 

  let user = await User.findOne({ email });
  
  if (!user) {
    user = await User.create({
      email,
      password: crypto.randomBytes(16).toString("hex"), // Random secure default pass
      role: "student", // default role
      firstLogin: false,
      verified: true,
    });
  }

  const token = generateToken(user._id, user.tokenVersion || 0);
  const refreshToken = generateRefreshToken(user._id);

  return {
    token,
    refreshToken,
    user: { id: user._id, role: user.role, division: user.division }
  };
};

export const logoutUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  return { message: "Logged out successfully" };
};