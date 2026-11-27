const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const logAdminAction = require('../utils/audit');
const removeFile = require('../utils/files');

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

// Count lessons and enrollments in batches so each row needs no extra requests.
async function attachCourseCounts(courses) {
  if (courses.length === 0) {
    return courses;
  }

  const courseIds = courses.map((course) => course._id);

  const pipeline = [
    { $match: { course: { $in: courseIds } } },
    { $group: { _id: '$course', count: { $sum: 1 } } },
  ];
  const [lessonRows, enrollmentRows] = await Promise.all([
    Lesson.aggregate(pipeline),
    Enrollment.aggregate(pipeline),
  ]);

  const lessonCounts = new Map(lessonRows.map((row) => [String(row._id), row.count]));
  const enrollmentCounts = new Map(enrollmentRows.map((row) => [String(row._id), row.count]));

  return courses.map((course) => ({
    ...course,
    lessonCount: lessonCounts.get(String(course._id)) || 0,
    enrolledCount: enrollmentCounts.get(String(course._id)) || 0,
  }));
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

  const coursesWithCounts = await attachCourseCounts(courses);

  return res.status(200).json({
    courses: coursesWithCounts,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

// GET /api/courses/mine (instructor and admin)
const listMyCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ instructor: req.user.id })
    .populate('instructor', 'name')
    .sort({ createdAt: -1 })
    .lean();

  if (courses.length === 0) {
    return res.status(200).json({ courses: [] });
  }

  const courseIds = courses.map((course) => course._id);

  // Two grouped queries for the whole list instead of two queries per course.
  const [lessonRows, enrollmentRows] = await Promise.all([
    Lesson.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
    ]),
    Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: '$course', count: { $sum: 1 } } },
    ]),
  ]);

  const lessonCounts = new Map(lessonRows.map((row) => [String(row._id), row.count]));
  const enrollmentCounts = new Map(
    enrollmentRows.map((row) => [String(row._id), row.count])
  );

  const coursesWithCounts = courses.map((course) => ({
    ...course,
    lessonCount: lessonCounts.get(String(course._id)) || 0,
    enrolledCount: enrollmentCounts.get(String(course._id)) || 0,
  }));

  return res.status(200).json({ courses: coursesWithCounts });
});

// GET /api/courses/:id (public)
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('instructor', 'name')
    .lean();

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const [lessonCount, enrolledCount] = await Promise.all([
    Lesson.countDocuments({ course: course._id }),
    Enrollment.countDocuments({ course: course._id }),
  ]);

  return res.status(200).json({
    course: { ...course, lessonCount, enrolledCount },
  });
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
