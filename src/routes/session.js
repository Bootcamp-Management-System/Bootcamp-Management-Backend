import express from "express";
import { createSession, getSessions, updateSession, deleteSession } from "../controllers/sessionController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";
import { checkDivisionAccess } from "../middlewares/divisionGuard.js";
import { bootcampGuard } from "../middlewares/bootcampGuard.js";

const router = express.Router();

router.use(protect);
router.use(bootcampGuard); // 🔒 Only accepted students + staff

router.route("/")
  .post(restrictTo("super-admin", "admin", "instructor"), checkDivisionAccess, createSession)
  .get(getSessions);

router.route("/:id")
  .patch(restrictTo("super-admin", "admin", "instructor"), updateSession)
  .delete(restrictTo("super-admin", "admin"), deleteSession);

export default router;
