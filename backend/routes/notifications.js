const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @GET /api/notifications - Get current user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/notifications/broadcast - Admin broadcasts notification
router.post('/broadcast', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, message, type, targetRole, targetUserIds } = req.body;
    if (!title || !message) return res.status(400).json({ message: 'Title and message are required' });

    let users;
    if (targetUserIds && targetUserIds.length > 0) {
      users = await User.find({ _id: { $in: targetUserIds } });
    } else if (targetRole && targetRole !== 'all') {
      users = await User.find({ role: targetRole, isActive: true });
    } else {
      users = await User.find({ isActive: true });
    }

    const notifications = users.map((u) => ({
      userId: u._id,
      title,
      message,
      type: type || 'info',
    }));

    await Notification.insertMany(notifications);
    res.status(201).json({ message: `Notification sent to ${notifications.length} users` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @DELETE /api/notifications/:id - Delete notification
router.delete('/:id', protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
