import Notification from "../models/Notification.js";

// @desc    Get user notifications
// @route   GET /api/v1/notifications
export const getNotifications = async (req, res) => {
  try {
    const { status, type, limit = 50 } = req.query;
    const query = { user: req.user.id };

    if (status === 'unread') query.isRead = false;
    if (status === 'read') query.isRead = true;
    if (type) query.type = type;

    const safeLimit = Math.min(Number(limit) || 50, 100);
    const notifications = await Notification.find(query)
      .populate('announcementId', 'title audience division createdAt')
      .sort("-createdAt")
      .limit(safeLimit);
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/v1/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/v1/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/v1/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
