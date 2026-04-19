import express from "express";
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