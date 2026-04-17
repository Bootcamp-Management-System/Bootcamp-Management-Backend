import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import sendEmail from "../services/emailService.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d" });
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.firstLogin) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = { code: otpCode, expiresAt: Date.now() + 10 * 60 * 1000 };
      await user.save();
      
      await sendEmail({ 
        to: user.email, 
        subject: "Verification OTP", 
        text: `Your OTP is ${otpCode}. It expires in 10 minutes.` 
      });
      return res.status(200).json({ message: "First login detected. OTP sent to email." });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: { id: user._id, role: user.role, division: user.division }
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || user.otp.code !== otp || user.otp.expiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Reset OTP and set new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.firstLogin = false;
    user.verified = true;
    await user.save();

    res.status(200).json({ message: "Password setup successful. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const googleLogin = async (req, res) => {
  // Assuming a token verification from Google OAuth library
  try {
    const { googleToken } = req.body;
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

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: { id: user._id, role: user.role, division: user.division }
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
