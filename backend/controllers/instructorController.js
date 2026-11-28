const Course = require('../models/Course');
const User = require('../models/User');
const Group = require('../models/Group');
const Enrollment = require('../models/Enrollment');
const Evaluation = require('../models/Evaluation');
const asyncHandler = require('../utils/asyncHandler');
const courseMetrics = require('../utils/courseMetrics');
const { courseScope, ownedCourse, escapeRegex } = require('../utils/dashboardAccess');

async function courseIds(req) {
  if (req.query.courseId) return [(await ownedCourse(req.user, req.query.courseId))._id];
  return Course.distinct('_id', courseScope(req.user));
}

function utcStart() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
}

// Roll up all scoped enrollments in one query, including unique learners and estimated revenue.
const overview = asyncHandler(async (req, res) => {
  const scope = courseScope(req.user);
  const today = utcStart();
  const [summary, courses, groups] = await Promise.all([
    Enrollment.aggregate([
      { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'courseData' } },
      { $unwind: '$courseData' },
      ...(req.user.role === 'admin' ? [] : [{ $match: { 'courseData.instructor': req.user._id } }]),
      { $group: {
        _id: '$student', firstEnrollment: { $min: '$createdAt' },
        earnings: { $sum: '$courseData.price' },
        today: { $sum: { $cond: [{ $gte: ['$createdAt', today] }, '$courseData.price', 0] } },
        seconds: { $sum: '$totalSeconds' }, sessions: { $sum: '$sessionCount' },
        progress: { $sum: '$progress' }, enrollments: { $sum: 1 },
      } },
      { $group: {
        _id: null, learners: { $sum: 1 },
        newLearners: { $sum: { $cond: [{ $gte: ['$firstEnrollment', today] }, 1, 0] } },
        earnings: { $sum: '$earnings' }, today: { $sum: '$today' },
        seconds: { $sum: '$seconds' }, sessions: { $sum: '$sessions' },
        learning: { $avg: '$seconds' }, progress: { $sum: '$progress' }, enrollments: { $sum: '$enrollments' },
      } },
    ]),
    Course.find(scope).sort({ createdAt: -1 }).limit(3).populate('instructor', 'name').lean(),
    Group.find(scope).sort({ createdAt: -1 }).limit(4).populate('members', 'name').lean(),
  ]);
  const totals = summary[0];
  res.json({
    learners: { total: totals?.learners ?? 0, newToday: totals?.newLearners ?? 0 },
    earnings: { total: totals?.earnings ?? 0, today: totals?.today ?? 0 },
    avgLearningSeconds: Math.round(totals?.learning ?? 0),
    avgAccessSeconds: totals?.sessions ? Math.round(totals.seconds / totals.sessions) : 0,
    completionRate: totals?.enrollments ? Math.round(totals.progress / totals.enrollments) : 0,
    courses: await courseMetrics(courses),
    groups: groups.map(({ members, ...group }) => ({
      ...group, memberCount: members.length, memberInitials: members.slice(0, 3).map(member => initials(member.name)),
    })),
  });
});

function studentsFor(ids) {
  return Enrollment.find({ course: { $in: ids } }).populate('student', 'name email')
    .populate('course', 'title').sort({ createdAt: -1 }).lean();
}

function studentRow(enrollment) {
  return {
    studentId: enrollment.student._id, name: enrollment.student.name, email: enrollment.student.email,
    course: enrollment.course, progress: enrollment.progress, totalSeconds: enrollment.totalSeconds ?? 0,
    lastAccessedAt: enrollment.lastAccessedAt ?? null,
  };
}

const tracking = asyncHandler(async (req, res) => {
  const rows = (await studentsFor(await courseIds(req))).filter(row => row.student && row.course);
  const start = utcStart();
  start.setUTCDate(start.getUTCDate() - 29);
  const days = new Map();
  for (let offset = 0; offset < 30; offset++) {
    const day = new Date(start.getTime() + offset * 86400000);
    days.set(day.toISOString().slice(0, 10), 0);
  }
  const progressBuckets = { 0: 0, '1-49': 0, '50-99': 0, 100: 0 };
  for (const row of rows) {
    const date = row.createdAt.toISOString().slice(0, 10);
    if (days.has(date)) days.set(date, days.get(date) + 1);
    const bucket = row.progress === 0 ? '0' : row.progress < 50 ? '1-49' : row.progress < 100 ? '50-99' : '100';
    progressBuckets[bucket]++;
  }
  res.json({ enrollmentsByDay: [...days].map(([date, count]) => ({ date, count })),
    progressBuckets, students: rows.map(studentRow) });
});

const students = asyncHandler(async (req, res) => {
  const ids = await courseIds(req);
  const [enrollments, evaluations] = await Promise.all([
    studentsFor(ids), Evaluation.find({ course: { $in: ids } }).lean(),
  ]);
  const lookup = new Map(evaluations.map(row => [`${row.course}:${row.student}`, row]));
  res.json({ students: enrollments.filter(row => row.student && row.course).map(row => ({
    ...studentRow(row), evaluation: lookup.get(`${row.course._id}:${row.student._id}`) ?? null,
  })) });
});

const search = asyncHandler(async (req, res) => {
  const pattern = new RegExp(escapeRegex(req.query.q), 'i');
  const scope = req.user.role === 'instructor' ? courseScope(req.user) : {};
  const person = { $or: [{ name: pattern }, { email: pattern }] };
  let people = [];
  if (req.user.role === 'admin') people = await User.find(person).select('name email role').limit(5).lean();
  if (req.user.role === 'instructor') {
    const ids = await Course.distinct('_id', scope);
    const enrolled = await Enrollment.distinct('student', { course: { $in: ids } });
    people = await User.find({ ...person, _id: { $in: enrolled }, role: 'student' }).select('name email').limit(5).lean();
  }
  const [courses, groups] = await Promise.all([
    Course.find({ ...scope, title: pattern }).select('title category').limit(5).lean(),
    req.user.role === 'student' ? [] : Group.find({ ...scope, name: pattern }).select('name course').limit(5).lean(),
  ]);
  res.json({ courses, students: people, groups });
});

module.exports = { overview, tracking, students, search };
