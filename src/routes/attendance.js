import express from "express";
import { checkIn, getAttendance, markAttendance } from "../controllers/attendanceController.js";
import { restrictTo, authMiddleware as protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.post("/check-in", restrictTo("student"), checkIn);
router.post("/mark", restrictTo("super-admin", "admin", "instructor"), markAttendance);
router.get("/", getAttendance);

export default router;