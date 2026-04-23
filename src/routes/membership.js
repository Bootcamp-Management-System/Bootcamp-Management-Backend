import express from "express";
import { handleDecision, getCandidates } from "../controllers/membershipController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";

const router = express.Router();

router.use(authMiddleware);
router.use(restrictTo("super-admin", "admin"));

router.patch("/decision", handleDecision);
router.get("/candidates/:bootcampId", getCandidates);

export default router;
