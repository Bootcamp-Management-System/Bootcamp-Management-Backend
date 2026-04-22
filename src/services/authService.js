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
  const { email, password, name } = userData;
  
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("Email already registered");

  const hashedPassword = await bcrypt.hash(password, 12);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    role: 'student',
    is_EmailVerified: false,
    otp: { code: otpCode, expiresAt: Date.now() + 15 * 60 * 1000 }
  });

  await EmailService.sendVerificationEmail(user.email, otpCode);
  return { message: "Signup successful. Please check your email for the verification OTP." };
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
  user.firstLogin = false;
  await user.save();

  return { message: "Account verified successfully. You can now log in." };
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid email or password");
  }

  if (!user.is_EmailVerified) {
    throw new Error("Please verify your email address before logging in.");
  }

  const token = generateToken(user._id, user.tokenVersion || 0);
  const refreshToken = generateRefreshToken(user._id);

  return {
    token,
    refreshToken,
    user: { 
      id: user._id, 
      role: user.role, 
      division: user.division,
      name: user.name
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
  return { token, refreshToken, user: { id: user._id, role: user.role } };
};

export const logoutUser = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
  }
  return { message: "Logged out successfully" };
};