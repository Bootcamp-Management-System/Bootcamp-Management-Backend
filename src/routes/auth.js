import express from "express";
import { signup, loginUser, verifyOtp, googleLogin, logoutUser } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.post("/google-login", googleLogin);
router.post("/logout", authMiddleware, logoutUser);

export default router;
