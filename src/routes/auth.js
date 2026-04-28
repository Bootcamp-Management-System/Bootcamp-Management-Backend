import express from "express";
import { signup, loginUser, verifyOtp, resendOtp, googleLogin, logoutUser, forgotPassword, resetPassword } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/google-login", googleLogin);
router.post("/logout", authMiddleware, logoutUser);

// Password Reset Flow
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;
