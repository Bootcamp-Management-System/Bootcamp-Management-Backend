import express from "express";
import { submitFeedback, getFeedback, updateFeedback, getSessionStats, getPublicFeedback } from "../controllers/feedbackController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";
import { bootcampGuard } from "../middlewares/bootcampGuard.js";

const router = express.Router();

// Public Route
router.get("/public", getPublicFeedback);

router.use(protect);
router.use(bootcampGuard); // 🔒 Only accepted students + staff

router.post("/", restrictTo("student"), submitFeedback);
router.get("/", restrictTo("super-admin", "admin", "instructor", "student"), getFeedback);
router.patch("/:id", restrictTo("student"), updateFeedback);
router.get("/stats/:sessionId", restrictTo("super-admin", "admin", "instructor"), getSessionStats);

export default router;
