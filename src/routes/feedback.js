import express from "express";
import { submitFeedback, getFeedback, getSessionStats, updateFeedback } from "../controllers/feedbackController.js";
import { authMiddleware as protect, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.post("/", restrictTo("student"), submitFeedback);
router.get("/", getFeedback);
router.put("/:id", restrictTo("student"), updateFeedback);
router.get("/stats/:sessionId", restrictTo("super-admin", "admin", "instructor"), getSessionStats);

export default router;
