import express from "express";
import { checkIn, getAttendance, markAttendance } from "../controllers/attendanceController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";
import { bootcampGuard } from "../middlewares/bootcampGuard.js";

const router = express.Router();

router.use(protect);
router.use(bootcampGuard); // 🔒 Only accepted students + staff

router.post("/check-in", restrictTo("student"), checkIn);
router.post("/mark", restrictTo("super-admin", "admin", "instructor"), markAttendance);
router.get("/", getAttendance);

export default router;