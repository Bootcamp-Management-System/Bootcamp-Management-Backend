import express from "express";
import { createSession, getSessions } from "../controllers/sessionController.js";
import { restrictTo, authMiddleware as protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .post(restrictTo("admin", "instructor"), createSession)
  .get(getSessions);

export default router;