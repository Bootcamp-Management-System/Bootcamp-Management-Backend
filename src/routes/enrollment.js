import express from "express";
import { 
  activateEnrollment, 
  getMyEnrollments,
  getBootcampEnrollments
} from "../controllers/enrollmentController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/activate", activateEnrollment);
router.get("/me", getMyEnrollments);
router.get("/bootcamp/:bootcampId", getBootcampEnrollments);

export default router;
