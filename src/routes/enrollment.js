import express from "express";
import {
  activateEnrollment,
  getMyEnrollments,
  getBootcampEnrollments,
  enrollInternalBootcamp
} from "../controllers/enrollmentController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/activate", activateEnrollment);
router.post("/internal", enrollInternalBootcamp);
router.get("/me", getMyEnrollments);
router.get("/bootcamp/:bootcampId", getBootcampEnrollments);

export default router;
