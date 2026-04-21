import express from "express";
import { checkIn, getAttendance, markAttendance } from "../controllers/attendanceController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { authorizeRole } from "../middlewares/roleBase/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/check-in", authorizeRole("student"), checkIn);
router.post("/mark", authorizeRole("super-admin", "admin", "instructor"), markAttendance);
router.get("/", getAttendance);

export default router;