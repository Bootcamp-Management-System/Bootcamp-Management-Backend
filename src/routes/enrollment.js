import express from "express";
import { 
  activateEnrollment, 
  getMyEnrollments 
} from "../controllers/enrollmentController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/activate", activateEnrollment);
router.get("/me", getMyEnrollments);

export default router;
