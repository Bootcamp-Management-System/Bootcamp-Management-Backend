import express from "express";
import { submitTask, reviewSubmission, getSubmissions, updateSubmission } from "../controllers/submissionController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { authorizeRole } from "../middlewares/roleBase/roleMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/submit", authorizeRole("student"), submitTask);
router.post("/:taskId", authorizeRole("student"), submitTask);
router.put("/:id", authorizeRole("student"), updateSubmission);
router.patch("/review/:id", authorizeRole("super-admin", "admin", "instructor"), reviewSubmission);
router.get("/", getSubmissions);

export default router;
