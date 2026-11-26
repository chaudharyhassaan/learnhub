const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const logAdminAction = require('../utils/audit');

// Same escaping rule as the course search: user text must never act as a regex.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const filter = {};

  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return res.status(200).json({
    users,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

// PATCH /api/admin/users/:id/role
const changeUserRole = asyncHandler(async (req, res) => {
  // An admin must not be able to remove their own access by accident.
  if (String(req.user.id) === String(req.params.id)) {
    return res.status(400).json({ message: 'You cannot change your own role.' });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const oldRole = user.role;
  user.role = req.body.role;
  await user.save();

  await logAdminAction(
    req,
    'change_user_role',
    'User',
    user._id,
    `Changed role of ${user.email} from ${oldRole} to ${user.role}`
  );

  return res.status(200).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.user.id) === String(req.params.id)) {
    return res.status(400).json({ message: 'You cannot delete your own account.' });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // An instructor with courses must be handled first, otherwise those courses
  // would point at a user that no longer exists.
  if (user.role === 'instructor') {
    const courseCount = await Course.countDocuments({ instructor: user._id });

    if (courseCount > 0) {
      return res.status(400).json({
        message: 'This instructor still has courses. Delete or reassign them first.',
      });
    }
  }

  const email = user.email;

  // Students lose their enrollment records with the account.
  await Enrollment.deleteMany({ student: user._id });
  await user.deleteOne();

  await logAdminAction(req, 'delete_user', 'User', user._id, `Deleted user ${email}`);

  return res.status(200).json({ message: 'User deleted' });
});

// GET /api/admin/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  // Start of the day six days ago, in UTC, so the seven buckets are predictable.
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 6);

  const [users, courses, enrollments, lessons, roleRows, topRows, dailyRows, averageRows] =
    await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Lesson.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Enrollment.aggregate([
        { $group: { _id: '$course', enrollments: { $sum: 1 } } },
        { $sort: { enrollments: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'course',
          },
        },
        { $unwind: '$course' },
        { $project: { _id: 0, title: '$course.title', enrollments: 1 } },
      ]),
      Enrollment.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
      Enrollment.aggregate([{ $group: { _id: null, average: { $avg: '$progress' } } }]),
    ]);

  const usersByRole = { admin: 0, instructor: 0, student: 0 };

  roleRows.forEach((row) => {
    if (row._id in usersByRole) {
      usersByRole[row._id] = row.count;
    }
  });

  const dailyCounts = new Map(dailyRows.map((row) => [row._id, row.count]));

  // Always seven entries, even on days with no enrollments.
  const enrollmentsLast7Days = [];

  for (let index = 0; index < 7; index += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    const key = day.toISOString().slice(0, 10);

    enrollmentsLast7Days.push({
      date: key,
      count: dailyCounts.get(key) || 0,
    });
  }

  const averageProgress = averageRows.length
    ? Math.round(averageRows[0].average * 10) / 10
    : 0;

  return res.status(200).json({
    totals: { users, courses, enrollments, lessons },
    usersByRole,
    topCourses: topRows,
    enrollmentsLast7Days,
    averageProgress,
  });
});

// GET /api/admin/audit-logs
const getAuditLogs = asyncHandler(async (req, res) => {
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('actor', 'name')
    .lean();

  return res.status(200).json({
    logs: logs.map((log) => ({
      _id: log._id,
      actor: { name: log.actor ? log.actor.name : 'Deleted user' },
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      details: log.details,
      createdAt: log.createdAt,
    })),
  });
});

module.exports = { listUsers, changeUserRole, deleteUser, getAnalytics, getAuditLogs };
