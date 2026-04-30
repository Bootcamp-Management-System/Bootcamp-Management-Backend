import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Division from '../models/Division.js';

export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, audience, division } = req.body;
    const author = req.user.id;

    const announcement = await Announcement.create({ title, content, audience, division, author });

    // Build the query to find target users
    let query = {};
    if (audience === 'All Students') query.role = 'student';
    else if (audience === 'All Instructors') query.role = 'instructor';
    else if (audience === 'All Admins') query.role = { $in: ['admin', 'super-admin'] };
    else if (audience === 'Division' && division) {
      // Find the division ID by name
      const div = await Division.findOne({ name: division });
      if (div) {
        query = { "memberships.division": div._id };
      } else {
        // If division not found, no users will match
        query = { _id: null };
      }
    }
    // If 'All Users', query remains {}

    const users = await User.find(query).select('_id');
    console.log(`[Announcements] Found ${users.length} users for query:`, query);

    // Create notifications for all matching users
    const notifications = users.map(u => ({
      user: u._id,
      title: `Announcement: ${title}`,
      message: content,
      type: "ANNOUNCEMENT",
      announcementId: announcement._id,
      isRead: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`[Announcements] Inserted ${notifications.length} notifications`);
    } else {
      console.log(`[Announcements] No notifications inserted because matching users length is 0`);
    }

    res.status(201).json({ success: true, data: announcement });
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

    // Build the query to find target users
    let query = {};
    if (audience === 'All Students') query.role = 'student';
    else if (audience === 'All Instructors') query.role = 'instructor';
    else if (audience === 'All Admins') query.role = { $in: ['admin', 'super-admin'] };
    else if (audience === 'Division' && division) {
      const div = await Division.findOne({ name: division });
      if (div) {
        query = { "memberships.division": div._id };
      } else {
        query = { _id: null };
      }
    }

    const users = await User.find(query).select('_id');

    const notifications = users.map(u => ({
      user: u._id,
      title: `Announcement: ${title}`,
      message: content,
      type: "ANNOUNCEMENT",
      announcementId: announcement._id,
      isRead: false
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(200).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
