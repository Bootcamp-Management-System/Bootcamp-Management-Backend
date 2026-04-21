import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  notifyUser,
  notifyDivision,
} from "../services/notificationService.js";

// @desc    Get all notifications for the logged-in user
// @route   GET /api/v1/notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await getNotificationsForUser(req.user.id);

    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Get count of unread notifications
// @route   GET /api/v1/notifications/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await getUnreadNotificationCount(req.user.id);
    res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/v1/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notification = await markNotificationAsRead(req.params.id, req.user.id);

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Mark all user notifications as read
// @route   PATCH /api/v1/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    const result = await markAllNotificationsAsRead(req.user.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
};

// @desc    Create a new notification (Admin/Super-Admin)
// @route   POST /api/v1/notifications
export const createNotification = async (req, res) => {
  try {
    const { title, message, type, link, recipientId, divisionId } = req.body;

    if (recipientId) {
      const notifications = await notifyUser({
        senderId: req.user.id,
        recipientId,
        title,
        message,
        type,
        link,
      });

      return res.status(201).json({ success: true, count: notifications.length, message: "Notifications dispatched" });
    } else if (divisionId) {
      const notifications = await notifyDivision({
        senderId: req.user.id,
        divisionId,
        title,
        message,
        type,
        link,
        requester: req.user,
      });

      return res.status(201).json({ success: true, count: notifications.length, message: "Notifications dispatched" });
    } else {
      return res.status(400).json({ error: "Must provide either 'recipientId' or 'divisionId'" });
    }
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: "Server Error", message: error.message });
  }
};