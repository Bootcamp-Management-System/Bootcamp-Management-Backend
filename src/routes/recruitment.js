import express from "express";
import { 
  createOrUpdateTemplate,
  publishTemplate,
  unpublishTemplate,
  getTemplate,
  apply, 
  submitTechnicalTask, 
  submitWaitlistTask, 
  makeDecision, 
  getApplications 
} from "../controllers/recruitmentController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";
import { checkDivisionAccess } from "../middlewares/divisionGuard.js";

const router = express.Router();

router.use(protect);

// ─── Admin: Application Template Management ──────────────────────────────────
// Admin builds and configures the form for a specific bootcamp; students see it only after publish
router.put(
  "/template/:bootcampId",
  restrictTo("super-admin", "admin"),
  checkDivisionAccess, // wait, how does checkDivisionAccess work here?
  createOrUpdateTemplate
);
router.patch(
  "/template/:bootcampId/publish",
  restrictTo("super-admin", "admin"),
  checkDivisionAccess,
  publishTemplate
);
router.patch(
  "/template/:bootcampId/unpublish",
  restrictTo("super-admin", "admin"),
  checkDivisionAccess,
  unpublishTemplate
);
// Both admin and students can GET template (controller handles visibility logic)
router.get("/template/:bootcampId", getTemplate);

// ─── Admin: Application Viewing & Decisions ──────────────────────────────────
router.get("/", restrictTo("super-admin", "admin"), getApplications);
router.patch("/:applicationId/decision", restrictTo("super-admin", "admin"), makeDecision);

// ─── Student: Application Submission ─────────────────────────────────────────
router.get("/my-applications", restrictTo("student"), getApplications);
router.post("/apply", restrictTo("student"), apply);
router.post("/application-submit", restrictTo("student"), submitTechnicalTask);
router.post("/waitlist-application-submit", restrictTo("student"), submitWaitlistTask);

export default router;
