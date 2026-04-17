import express from "express";
import { checkIn } from "../controllers/attendanceController.js";
import { restrictTo, authMiddleware as protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.post("/check-in", restrictTo("student"), checkIn);

export default router;