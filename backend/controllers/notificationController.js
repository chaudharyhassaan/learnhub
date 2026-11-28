const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { fail } = require('../utils/dashboardAccess');

// Scope all reads and updates to the authenticated recipient.
const list = asyncHandler(async (req, res) => {
  const filter = { user: req.user.id };
  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(20).lean(),
    Notification.countDocuments({ ...filter, readAt: null }),
  ]);
  res.json({ notifications, unreadCount });
});

const readAll = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, readAt: null }, { $set: { readAt: new Date() } });
  res.json({ message: 'Notifications marked as read.' });
});

const read = asyncHandler(async (req, res) => {
  const item = await Notification.findOne({ _id: req.params.id, user: req.user.id });
  if (!item) fail(404, 'Notification not found.');
  if (!item.readAt) {
    item.readAt = new Date();
    await item.save();
  }
  res.json({ notification: item });
});

module.exports = { list, readAll, read };
