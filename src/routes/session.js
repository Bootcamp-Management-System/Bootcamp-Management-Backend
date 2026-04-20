import express from "express";
import {
  createSession,
  getSessions,
} from "../controllers/sessionController.js";
import {
  checkDivisionAccess,
  authMiddleware as protect,
  restrictTo,
} from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .post(restrictTo("super-admin", "admin"), checkDivisionAccess, createSession)
  .get(checkDivisionAccess, getSessions);

export default router;
import { createSession, getSessions, updateSession, deleteSession } from "../controllers/sessionController.js";
import { getResourcesBySession } from "../controllers/resourceController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// router.use(authMiddleware); // Temporarily disabled for testing

router.route("/")
  .post(createSession)
  .get(getSessions);

router.route("/:id")
  .put(updateSession)
  .delete(deleteSession);

router.get("/:session_id/resources", getResourcesBySession);

export default router;
