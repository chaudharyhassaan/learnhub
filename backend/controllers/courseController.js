const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const logAdminAction = require('../utils/audit');
const removeFile = require('../utils/files');
const courseMetrics = require('../utils/courseMetrics');
const Review = require('../models/Review');
const Evaluation = require('../models/Evaluation');
const Event = require('../models/Event');
const Group = require('../models/Group');
const LearningPath = require('../models/LearningPath');
const { courseScope } = require('../utils/dashboardAccess');

// Sort options are whitelisted here, so a query string can never choose an arbitrary field.
const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
};

// Why: a user search is plain text, so regex symbols must be escaped before
// they reach the database. Otherwise "c++" or "(" would break the query.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/courses (public)
const listCourses = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const sort = req.query.sort || 'newest';

  const filter = {};

  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  if (req.query.category) {
    filter.category = req.query.category;
  }

  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('instructor', 'name')
      .sort(SORT_OPTIONS[sort] || SORT_OPTIONS.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Course.countDocuments(filter),
  ]);

  const coursesWithCounts = await courseMetrics(courses);

  return res.status(200).json({
    courses: coursesWithCounts,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

// GET /api/courses/mine (instructor and admin)
const listMyCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find(courseScope(req.user))
    .populate('instructor', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({ courses: await courseMetrics(courses) });
});

// GET /api/courses/:id (public)
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('instructor', 'name')
    .lean();

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const [details] = await courseMetrics([course]);
  return res.status(200).json({ course: details });
});

// POST /api/courses (instructor and admin)
const createCourse = asyncHandler(async (req, res) => {
  // Whitelisted fields only. The instructor always comes from the token,
  // so a client cannot create a course for somebody else.
  const course = await Course.create({
    title: String(req.body.title).trim(),
    description: String(req.body.description).trim(),
    category: req.body.category,
    price:
      req.body.price === undefined || req.body.price === ''
        ? 0
        : Number(req.body.price),
    thumbnail: req.body.thumbnail ? String(req.body.thumbnail).trim() : '',
    instructor: req.user.id,
    level: req.body.level,
    durationHours: req.body.durationHours,
    originalPrice: req.body.originalPrice,
  });

  // Populate before responding so the new course looks like the list items.
  await course.populate('instructor', 'name');

  return res.status(201).json({ course });
});

// PUT /api/courses/:id (owner or admin)
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  // IDOR guard: an instructor may only change a course they own.
  const isOwner = String(course.instructor) === String(req.user.id);

  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You can only edit your own courses.' });
  }

  // Explicit whitelist. instructor is never read from the body.
  if (req.body.title !== undefined) {
    course.title = String(req.body.title).trim();
  }

  if (req.body.description !== undefined) {
    course.description = String(req.body.description).trim();
  }

  if (req.body.category !== undefined) {
    course.category = req.body.category;
  }

  if (req.body.price !== undefined && req.body.price !== '') {
    course.price = Number(req.body.price);
  }

  if (req.body.thumbnail !== undefined) {
    course.thumbnail = String(req.body.thumbnail).trim();
  }

  for (const field of ['level', 'durationHours', 'originalPrice']) {
    if (req.body[field] !== undefined) course[field] = req.body[field];
  }
  await course.save();
  await course.populate('instructor', 'name');

  return res.status(200).json({ course });
});

// DELETE /api/courses/:id (owner or admin)
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const isOwner = String(course.instructor) === String(req.user.id);

  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You can only delete your own courses.' });
  }

  // Cascade: remove lesson files first, then the records that point at the course.
  const lessons = await Lesson.find({ course: course._id });

  for (const lesson of lessons) {
    await removeFile(lesson.filePath);
  }

  await Lesson.deleteMany({ course: course._id });
  await Enrollment.deleteMany({ course: course._id });
  await Promise.all([
    Review.deleteMany({ course: course._id }),
    Evaluation.deleteMany({ course: course._id }),
    Event.deleteMany({ course: course._id }),
    Group.deleteMany({ course: course._id }),
    LearningPath.deleteMany({ courses: course._id, 'courses.2': { $exists: false } }),
  ]);
  await LearningPath.updateMany({ courses: course._id }, { $pull: { courses: course._id } });
  await course.deleteOne();

  // Only an admin acting on someone else's course is an admin action worth logging.
  if (req.user.role === 'admin' && !isOwner) {
    await logAdminAction(
      req,
      'delete_course',
      'Course',
      course._id,
      `Deleted course "${course.title}"`
    );
  }

  return res.status(200).json({ message: 'Course deleted' });
});

module.exports = {
  listCourses,
  listMyCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
};
