import express from "express";
import { loginUser, verifyOtp, googleLogin } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.post("/google-login", googleLogin);

export default router;
