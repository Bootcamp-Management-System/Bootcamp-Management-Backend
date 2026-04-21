import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification
} from "../controllers/notificationController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { authorizeRole } from "../middlewares/roleBase/roleMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

// Routes for all authenticated users
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

// Route for admins to broadcast notifications
router.post("/", authorizeRole("super-admin", "admin"), createNotification);

export default router;