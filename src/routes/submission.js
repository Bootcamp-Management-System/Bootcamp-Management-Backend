import express from "express";
import { submitTask, reviewSubmission, getSubmissions, updateSubmission } from "../controllers/submissionController.js";
import { authMiddleware as protect, restrictTo } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.post("/submit", restrictTo("student"), submitTask);
router.put("/:id", restrictTo("student"), updateSubmission);
router.patch("/review/:id", restrictTo("super-admin", "admin", "instructor"), reviewSubmission);
router.get("/", getSubmissions);

export default router;
