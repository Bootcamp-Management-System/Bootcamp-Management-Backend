import express from "express";
import { uploadResource, getResources, deleteResource, getResourceById, getResourcesBySession } from "../controllers/resourceController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";
import { restrictTo } from "../middlewares/roleValidator.js";
import { bootcampGuard } from "../middlewares/bootcampGuard.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.use(protect);
router.use(bootcampGuard); // 🔒 Only accepted students + staff

router.post("/upload", restrictTo("super-admin", "admin", "instructor"), upload.single("file"), uploadResource);
router.get("/", getResources);
router.get("/session/:session_id", getResourcesBySession);
router.get("/:resource_id", getResourceById);
router.delete("/:resource_id", restrictTo("super-admin", "admin", "instructor"), deleteResource);

export default router;
