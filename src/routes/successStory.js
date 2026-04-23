import express from "express";
import { 
  getPublicSuccessStories, 
  createSuccessStory, 
  deleteSuccessStory 
} from "../controllers/successStoryController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";

const router = express.Router();

// Public Route
router.get("/public", getPublicSuccessStories);

// Admin Routes
router.use(protect);
router.post("/", restrictTo("super-admin", "admin"), createSuccessStory);
router.delete("/:id", restrictTo("super-admin", "admin"), deleteSuccessStory);

export default router;
