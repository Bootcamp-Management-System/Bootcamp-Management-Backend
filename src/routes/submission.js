import express from "express";
import { submitTask, updateSubmission, reviewSubmission, getSubmissions } from "../controllers/submissionController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";
import { bootcampGuard } from "../middlewares/bootcampGuard.js";

const router = express.Router();

router.use(protect);
router.use(bootcampGuard); // 🔒 Only accepted students + staff

router.post("/", restrictTo("student"), submitTask);
router.get("/", restrictTo("super-admin", "admin", "instructor", "student"), getSubmissions);
router.patch("/:id", restrictTo("student"), updateSubmission);
router.patch("/:id/review", restrictTo("super-admin", "admin", "instructor"), reviewSubmission);

export default router;
