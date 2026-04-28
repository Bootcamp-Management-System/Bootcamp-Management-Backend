import express from "express";
import { createSession, getSessions, updateSession, deleteSession, assignInstructor, getAvailableInstructors } from "../controllers/sessionController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";
import { checkDivisionAccess } from "../middlewares/divisionGuard.js";
import { bootcampGuard } from "../middlewares/bootcampGuard.js";

const router = express.Router();

router.use(protect);
// router.use(bootcampGuard); // Removed for division-wide sessions

router.route("/")
  .post(checkDivisionAccess, createSession)
  .get(getSessions);

router.route("/:id")
  .patch(restrictTo("super-admin", "admin", "instructor"), updateSession)
  .delete(restrictTo("super-admin", "admin"), deleteSession);

router.patch("/:id/assign-instructor", restrictTo("super-admin", "admin"), assignInstructor);

// New route to get available instructors for a division
router.get("/available-instructors/:divisionId", restrictTo("super-admin", "admin"), getAvailableInstructors);

export default router;
