import express from "express";
import { submitFeedback, getFeedback, updateFeedback, getSessionStats, getPublicFeedback } from "../controllers/feedbackController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";
import { bootcampGuard } from "../middlewares/bootcampGuard.js";

const router = express.Router();

const allowFeedbackSubmitter = (req, res, next) => {
  if (["student", "member"].includes(req.user?.role)) return next();

  const normalizedViewRole = req.headers["x-view-role"] === "super_admin"
    ? "super-admin"
    : req.headers["x-view-role"];

  const roleHierarchy = { "super-admin": 3, admin: 2, instructor: 1, student: 0, member: 0 };
  const canViewAsLearner =
    ["super-admin", "admin", "instructor"].includes(req.user?.role) &&
    ["student", "member"].includes(normalizedViewRole) &&
    roleHierarchy[normalizedViewRole] <= roleHierarchy[req.user.role];

  if (canViewAsLearner) return next();

  return res.status(403).json({
    success: false,
    message: `Role (${req.user?.role}) is not allowed to access this resource`,
  });
};

// Public Route
router.get("/public", getPublicFeedback);

router.use(protect);
router.use(bootcampGuard); // 🔒 Only accepted students + staff

router.post("/", allowFeedbackSubmitter, submitFeedback);
router.get("/", restrictTo("super-admin", "admin", "instructor", "student", "member"), getFeedback);
router.patch("/:id", allowFeedbackSubmitter, updateFeedback);
router.get("/stats/:sessionId", restrictTo("super-admin", "admin", "instructor"), getSessionStats);

export default router;
