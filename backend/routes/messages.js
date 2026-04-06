const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @GET /api/messages/contacts - Get list of users to message
router.get('/contacts', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id }, isActive: true })
      .select('name email role')
      .sort({ name: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/messages/thread/:userId - Get message thread with a user
router.get('/thread/:userId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, recipientId: req.params.userId },
        { senderId: req.params.userId, recipientId: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100);

    // Mark messages as read
    await Message.updateMany(
      { senderId: req.params.userId, recipientId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/messages - Get inbox (latest message per contact)
router.get('/', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.user._id }, { recipientId: req.user._id }],
    })
      .populate('senderId', 'name email role')
      .populate('recipientId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(200);

    // Build unique conversations
    const convMap = new Map();
    messages.forEach((msg) => {
      const otherId =
        msg.senderId._id.toString() === req.user._id.toString()
          ? msg.recipientId._id.toString()
          : msg.senderId._id.toString();
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          userId: otherId,
          user:
            msg.senderId._id.toString() === req.user._id.toString() ? msg.recipientId : msg.senderId,
          lastMessage: msg.content,
          lastTime: msg.createdAt,
          unread: msg.recipientId._id.toString() === req.user._id.toString() && !msg.isRead ? 1 : 0,
        });
      } else if (!msg.isRead && msg.recipientId._id.toString() === req.user._id.toString()) {
        convMap.get(otherId).unread += 1;
      }
    });

    res.json(Array.from(convMap.values()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @POST /api/messages - Send a message
router.post('/', protect, async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    if (!recipientId || !content?.trim()) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }
    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    const msg = await Message.create({
      senderId: req.user._id,
      recipientId,
      content: content.trim(),
    });

    const populated = await msg.populate([
      { path: 'senderId', select: 'name email role' },
      { path: 'recipientId', select: 'name email role' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @GET /api/messages/unread-count
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({ recipientId: req.user._id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
