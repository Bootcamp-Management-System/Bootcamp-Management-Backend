import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Division from '../models/Division.js';

const buildAnnouncementAudienceQuery = async (audience, division) => {
  if (audience === 'All Students') return { role: 'student' };
  if (audience === 'All Instructors') return { role: 'instructor' };
  if (audience === 'All Admins') return { role: { $in: ['admin', 'super-admin', 'super_admin'] } };

  if (audience === 'Division' && division) {
    const div = await Division.findOne({ name: division });
    if (!div) return { _id: null };

    return {
      $or: [
        { "memberships.division": div._id },
        { division: div._id },
        { assignedDivisions: div._id },
      ],
    };
  }

  return {};
};

const createAnnouncementNotifications = async (announcement, senderId) => {
  const query = await buildAnnouncementAudienceQuery(announcement.audience, announcement.division);
  const recipientQuery = Object.keys(query).length
    ? { $and: [query, { _id: { $ne: senderId } }] }
    : { _id: { $ne: senderId } };
  const users = await User.find(recipientQuery).select('_id');

  if (users.length === 0) return 0;

  const notifications = users.map((u) => ({
    user: u._id,
    title: `Announcement: ${announcement.title}`,
    message: announcement.content,
    type: "ANNOUNCEMENT",
    announcementId: announcement._id,
    link: "/notifications",
    isRead: false,
  }));

  await Notification.insertMany(notifications);
  return notifications.length;
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, audience, division } = req.body;
    const author = req.user.id;

    const announcement = await Announcement.create({ title, content, audience, division, author });
    const notificationCount = await createAnnouncementNotifications(announcement, author);

    res.status(201).json({ success: true, data: announcement, notificationCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('author', 'name role')
      .sort('-createdAt');
    res.status(200).json({ success: true, count: announcements.length, data: announcements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    // Delete associated notifications
    await Notification.deleteMany({ announcementId: announcement._id });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { title, content, audience, division } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }

    announcement.title = title;
    announcement.content = content;
    announcement.audience = audience;
    announcement.division = division;
    await announcement.save();

    // To cleanly handle audience changes, delete old notifications and create new ones
    await Notification.deleteMany({ announcementId: announcement._id });
    const notificationCount = await createAnnouncementNotifications(announcement, req.user.id);

    res.status(200).json({ success: true, data: announcement, notificationCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
