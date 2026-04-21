import express from "express";
import {
  createSession,
  getSessions,
  updateSession,
  deleteSession,
  assignInstructor
} from "../controllers/sessionController.js";
import { getResourcesBySession } from "../controllers/resourceController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { authorizeRole } from "../middlewares/roleBase/roleMiddleware.js";
import { checkDivisionAccess } from "../middlewares/roleBase/divisionMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router
  .route("/")
  .post(authorizeRole("super-admin", "admin"), checkDivisionAccess, createSession)
  .get(checkDivisionAccess, getSessions);

router
  .route("/:id")
  .put(authorizeRole("super-admin", "admin"), checkDivisionAccess, updateSession)
  .delete(authorizeRole("super-admin", "admin"), checkDivisionAccess, deleteSession);

router
  .route("/:id/assign-instructor")
  .patch(authorizeRole("super-admin", "admin"), checkDivisionAccess, assignInstructor);

router.get("/:session_id/resources", checkDivisionAccess, getResourcesBySession);

export default router;
