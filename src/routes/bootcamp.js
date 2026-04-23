import express from "express";
import { 
  createBootcamp, 
  getBootcamps, 
  getBootcamp, 
  updateBootcamp, 
  deleteBootcamp,
  getPublicBootcamps 
} from "../controllers/bootcampController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";

const router = express.Router();

// Public Routes (No Auth Required)
router.get("/public", getPublicBootcamps);
router.get("/public/:id", getBootcamp);

// Protected Routes
router.use(authMiddleware);

router
  .route("/")
  .post(restrictTo("super-admin", "admin"), createBootcamp)
  .get(getBootcamps);

router
  .route("/:id")
  .get(getBootcamp)
  .put(restrictTo("super-admin", "admin"), updateBootcamp)
  .delete(restrictTo("super-admin", "admin"), deleteBootcamp);

export default router;
