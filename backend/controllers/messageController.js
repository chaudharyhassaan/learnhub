const { Types } = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Message = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');
const { fail } = require('../utils/dashboardAccess');
const notify = require('../utils/notify');

// Derive contacts from current enrollments rather than trusting client-provided roles.
async function relatedIds(user) {
  if (user.role === 'instructor') {
    const courses = await Course.distinct('_id', { instructor: user.id });
    return Enrollment.distinct('student', { course: { $in: courses } });
  }
  const courses = await Enrollment.distinct('course', { student: user.id });
  return Course.distinct('instructor', { _id: { $in: courses } });
}

async function contactFilter(user) {
  if (user.role === 'admin') return { _id: { $ne: user.id } };
  const ids = await relatedIds(user);
  return { _id: { $ne: user.id }, $or: [
    { role: 'admin' },
    { _id: { $in: ids }, role: user.role === 'instructor' ? 'student' : 'instructor' },
  ] };
}

async function requireContact(user, id) {
  const filter = await contactFilter(user);
  const contact = await User.findOne({ $and: [filter, { _id: id }] }).select('name role');
  if (!contact) fail(403, 'You cannot message this account.');
  return contact;
}

const contacts = asyncHandler(async (req, res) => {
  const users = await User.find(await contactFilter(req.user)).select('name role').sort({ name: 1 }).lean();
  res.json({ contacts: users });
});

const send = asyncHandler(async (req, res) => {
  const { recipientId, body } = req.body;
  await requireContact(req.user, recipientId);
  const message = await Message.create({ sender: req.user.id, recipient: recipientId, body });
  await notify([recipientId], 'message', `New message from ${req.user.name}`, '/dashboard/inbox');
  res.status(201).json({ message });
});

const conversations = asyncHandler(async (req, res) => {
  const me = new Types.ObjectId(req.user.id);
  const allowed = await User.distinct('_id', await contactFilter(req.user));
  const rows = await Message.aggregate([
    { $match: { $or: [{ sender: me, recipient: { $in: allowed } }, { recipient: me, sender: { $in: allowed } }] } },
    { $sort: { createdAt: -1, _id: -1 } },
    { $group: {
      _id: { $cond: [{ $eq: ['$sender', me] }, '$recipient', '$sender'] },
      latest: { $first: '$$ROOT' },
      unreadCount: { $sum: { $cond: [{ $and: [
        { $eq: ['$recipient', me] }, { $eq: [{ $ifNull: ['$readAt', null] }, null] },
      ] }, 1, 0] } },
    } },
    { $sort: { 'latest.createdAt': -1 } },
  ]);
  await User.populate(rows, { path: '_id', model: User, select: 'name role' });
  res.json({ conversations: rows.filter(row => row._id).map(row => ({
    contact: row._id, latest: row.latest, unreadCount: row.unreadCount,
  })) });
});

const thread = asyncHandler(async (req, res) => {
  const contact = await requireContact(req.user, req.params.userId);
  const me = req.user.id;
  const them = contact.id;
  const readAt = new Date();
  const filter = { $or: [{ sender: me, recipient: them }, { sender: them, recipient: me }] };
  const messages = await Message.find(filter).sort({ createdAt: -1, _id: -1 }).limit(200).lean();
  await Message.updateMany(
    { sender: them, recipient: me, readAt: null, createdAt: { $lte: readAt } },
    { $set: { readAt } }
  );
  messages.forEach(message => {
    if (String(message.recipient) === me && !message.readAt && message.createdAt <= readAt) message.readAt = readAt;
  });
  res.json({ contact, messages: messages.reverse() });
});

module.exports = { contacts, send, conversations, thread };
