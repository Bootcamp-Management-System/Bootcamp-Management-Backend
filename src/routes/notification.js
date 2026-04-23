import express from "express";
import { getNotifications, markAsRead } from "../controllers/notificationController.js";
import { authMiddleware as protect } from "../middlewares/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);

export default router;
