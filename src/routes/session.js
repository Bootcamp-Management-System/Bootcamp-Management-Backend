import express from "express";
import { createSession, getSessions } from "../controllers/sessionController.js";
import { restrictTo, authMiddleware as protect, checkDivisionAccess } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .post(restrictTo("super-admin", "admin"), checkDivisionAccess, createSession)
  .get(checkDivisionAccess, getSessions);


export default router;