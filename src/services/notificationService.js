import Notification from "../models/Notification.js";
import User from "../models/User.js";

const buildNotificationDocuments = ({ recipientIds, senderId, title, message, type, link }) => {
  return recipientIds.map((recipientId) => ({
    recipient: recipientId,
    sender: senderId,
    title,
    message,
    type: type || "info",
    link,
  }));
};

export const getNotificationsForUser = async (userId) => {
  return await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .populate("sender", "email");
};

export const getUnreadNotificationCount = async (userId) => {
  return await Notification.countDocuments({ recipient: userId, isRead: false });
};

export const markNotificationAsRead = async (notificationId, userId) => {
  const notification = await Notification.findById(notificationId);

  if (!notification) {
    const error = new Error("Notification not found");
    error.statusCode = 404;
    throw error;
  }

  if (notification.recipient.toString() !== userId.toString()) {
    const error = new Error("Not authorized to access this notification");
    error.statusCode = 403;
    throw error;
  }

  notification.isRead = true;
  await notification.save();
  return notification;
};

export const markAllNotificationsAsRead = async (userId) => {
  await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  return { message: "All notifications marked as read" };
};

export const notifyUsers = async ({ senderId, recipientIds, title, message, type, link }) => {
  if (!recipientIds || recipientIds.length === 0) {
    const error = new Error("No valid users found to notify");
    error.statusCode = 404;
    throw error;
  }

  const notifications = buildNotificationDocuments({
    recipientIds,
    senderId,
    title,
    message,
    type,
    link,
  });

  return await Notification.insertMany(notifications);
};

export const notifyUser = async ({ senderId, recipientId, title, message, type, link }) => {
  const user = await User.findById(recipientId).select("_id");

  if (!user) {
    const error = new Error("Recipient user not found");
    error.statusCode = 404;
    throw error;
  }

  return await notifyUsers({
    senderId,
    recipientIds: [user._id],
    title,
    message,
    type,
    link,
  });
};

export const notifyDivision = async ({ senderId, divisionId, title, message, type, link, requester }) => {
  if (requester.role === "admin" && requester.division && requester.division.toString() !== divisionId.toString()) {
    const error = new Error("You can only broadcast inside your own division");
    error.statusCode = 403;
    throw error;
  }

  const usersInDivision = await User.find({
    $or: [{ division: divisionId }, { assignedDivisions: divisionId }],
  }).select("_id");

  return await notifyUsers({
    senderId,
    recipientIds: usersInDivision.map((user) => user._id),
    title,
    message,
    type,
    link,
  });
};
