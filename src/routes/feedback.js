import express from "express";
import { submitFeedback, getFeedback, getSessionStats, updateFeedback } from "../controllers/feedbackController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { authorizeRole } from "../middlewares/roleBase/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", authorizeRole("student"), submitFeedback);
router.get("/", getFeedback);
router.put("/:id", authorizeRole("student"), updateFeedback);
router.get("/stats/:sessionId", authorizeRole("super-admin", "admin", "instructor"), getSessionStats);

export default router;
