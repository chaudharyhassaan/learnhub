const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const recalculateProgress = require('../utils/progress');

// Why: the my-courses card needs the same small course shape in both endpoints.
function shapeCourse(course, lessonCount) {
  return {
    _id: course._id,
    title: course.title,
    category: course.category,
    price: course.price,
    thumbnail: course.thumbnail,
    instructor: {
      name: course.instructor ? course.instructor.name : '',
    },
    lessonCount,
  };
}

// POST /api/enroll
const enroll = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  const course = await Course.findById(courseId).select('_id');

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  // student always comes from the token, never from the body.
  const existing = await Enrollment.findOne({ student: req.user.id, course: courseId });

  if (existing) {
    return res.status(409).json({ message: 'You are already enrolled in this course.' });
  }

  let enrollment;

  try {
    enrollment = await Enrollment.create({
      student: req.user.id,
      course: courseId,
    });
  } catch (error) {
    // The unique index is the final guard when two requests arrive together.
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You are already enrolled in this course.' });
    }

    throw error;
  }

  return res.status(201).json({ enrollment });
});

// GET /api/my-courses
const getMyCourses = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user.id })
    .populate({
      path: 'course',
      select: 'title category price thumbnail instructor',
      populate: { path: 'instructor', select: 'name' },
    })
    .sort({ createdAt: -1 })
    .lean();

  // A deleted course removes its enrollments, but skip any leftover just in case.
  const validEnrollments = enrollments.filter((enrollment) => enrollment.course);

  if (validEnrollments.length === 0) {
    return res.status(200).json({ courses: [] });
  }

  const courseIds = validEnrollments.map((enrollment) => enrollment.course._id);

  // One aggregate for every course on the page, instead of one count per card.
  const rows = await Lesson.aggregate([
    { $match: { course: { $in: courseIds } } },
    { $group: { _id: '$course', count: { $sum: 1 } } },
  ]);

  const lessonCounts = new Map(rows.map((row) => [String(row._id), row.count]));

  const courses = validEnrollments.map((enrollment) => ({
    enrollmentId: enrollment._id,
    progress: enrollment.progress,
    completedCount: enrollment.completedLessons.length,
    course: shapeCourse(
      enrollment.course,
      lessonCounts.get(String(enrollment.course._id)) || 0
    ),
  }));

  return res.status(200).json({ courses });
});

// GET /api/my-courses/:courseId
const getMyCourse = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user.id,
    course: req.params.courseId,
  })
    .populate({
      path: 'course',
      select: 'title category price thumbnail instructor',
      populate: { path: 'instructor', select: 'name' },
    })
    .lean();

  if (!enrollment || !enrollment.course) {
    return res.status(404).json({ message: 'You are not enrolled in this course.' });
  }

  const lessons = await Lesson.find({ course: req.params.courseId })
    .select('_id title type order')
    .sort({ order: 1 })
    .lean();

  const completedIds = new Set(enrollment.completedLessons.map((id) => String(id)));

  return res.status(200).json({
    course: shapeCourse(enrollment.course, lessons.length),
    progress: enrollment.progress,
    lessons: lessons.map((lesson) => ({
      _id: lesson._id,
      title: lesson.title,
      type: lesson.type,
      order: lesson.order,
      completed: completedIds.has(String(lesson._id)),
    })),
  });
});

// PATCH /api/my-courses/:courseId/lessons/:lessonId
const updateLessonProgress = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const completed = req.body.completed;

  // The student filter is part of every query, so one student can never touch
  // another student's progress.
  const enrollment = await Enrollment.findOne({
    student: req.user.id,
    course: courseId,
  });

  if (!enrollment) {
    return res.status(404).json({ message: 'You are not enrolled in this course.' });
  }

  // The course check makes sure the lesson really belongs to this course.
  const lesson = await Lesson.findOne({ _id: lessonId, course: courseId }).select('_id');

  if (!lesson) {
    return res.status(404).json({ message: 'Lesson not found' });
  }

  // $addToSet and $pull keep completedLessons free of duplicates.
  await Enrollment.updateOne(
    { _id: enrollment._id, student: req.user.id },
    completed
      ? { $addToSet: { completedLessons: lesson._id } }
      : { $pull: { completedLessons: lesson._id } }
  );

  const updated = await Enrollment.findById(enrollment._id);

  if (!updated) {
    return res.status(404).json({ message: 'You are not enrolled in this course.' });
  }

  await recalculateProgress(updated);
  await updated.save();

  return res.status(200).json({ progress: updated.progress, completed });
});

module.exports = { enroll, getMyCourses, getMyCourse, updateLessonProgress };
