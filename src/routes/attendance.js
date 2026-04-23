import express from "express";
import { getAttendance, markAttendance, generateAttendanceQR, scanQRCode } from "../controllers/attendanceController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";
import { bootcampGuard } from "../middlewares/bootcampGuard.js";

const router = express.Router();

router.use(protect);
router.use(bootcampGuard); // 🔒 Only accepted students + staff

// High-Trust QR Scan (Replaces insecure check-in)
router.get("/qr-token/:sessionId", restrictTo("super-admin", "admin", "instructor"), generateAttendanceQR);
router.post("/scan", restrictTo("student"), scanQRCode);

router.post("/mark", restrictTo("super-admin", "admin", "instructor"), markAttendance);
router.get("/", getAttendance);

export default router;