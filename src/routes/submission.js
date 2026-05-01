import express from "express";
import { submitTask, updateSubmission, reviewSubmission, getSubmissions } from "../controllers/submissionController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";
import { bootcampGuard } from "../middlewares/bootcampGuard.js";
import submissionUpload from "../middlewares/submissionUpload.js";

const router = express.Router();

const allowStudentAction = (req, res, next) => {
  if (req.user?.role === "student") return next();

  const normalizedViewRole = req.headers["x-view-role"] === "super_admin"
    ? "super-admin"
    : req.headers["x-view-role"] === "member"
    ? "student"
    : req.headers["x-view-role"];
  const roleHierarchy = { "super-admin": 3, admin: 2, instructor: 1, student: 0 };
  const canViewAsStudent =
    ["super-admin", "admin", "instructor"].includes(req.user?.role) &&
    normalizedViewRole === "student" &&
    roleHierarchy[normalizedViewRole] <= roleHierarchy[req.user.role];

  if (canViewAsStudent) return next();

  return res.status(403).json({
    success: false,
    message: `Role (${req.user?.role}) is not allowed to access this resource`,
  });
};

router.use(protect);
router.use(bootcampGuard); // 🔒 Only accepted students + staff

router.post("/", allowStudentAction, submissionUpload.single("file"), submitTask);
router.post("/:taskId", allowStudentAction, submissionUpload.single("file"), submitTask);
router.get("/", restrictTo("super-admin", "admin", "instructor", "student"), getSubmissions);
router.patch("/:id", allowStudentAction, submissionUpload.single("file"), updateSubmission);
router.patch("/:id/review", restrictTo("super-admin", "admin", "instructor"), reviewSubmission);

export default router;
