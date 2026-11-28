const Course = require('../models/Course');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');
const { fail, requireEnrollment } = require('../utils/dashboardAccess');
const notify = require('../utils/notify');

// Return a display name only, without exposing student accounts to visitors.
const list = asyncHandler(async (req, res) => {
  if (!await Course.exists({ _id: req.params.id })) fail(404, 'Course not found.');
  const rows = await Review.find({ course: req.params.id }).sort({ updatedAt: -1 }).limit(20)
    .populate('student', 'name').lean();
  const reviews = rows.map(row => ({
    _id: row._id, rating: row.rating, comment: row.comment, updatedAt: row.updatedAt,
    firstName: row.student?.name.trim().split(/\s+/)[0] || 'Learner',
  }));
  res.json({ reviews });
});

const save = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).select('instructor title');
  if (!course) fail(404, 'Course not found.');
  await requireEnrollment(course.id, req.user.id);
  const { rating, comment = '' } = req.body;
  const review = await Review.findOneAndUpdate({ course: course.id, student: req.user.id },
    { $set: { rating, comment } }, { upsert: true, new: true, runValidators: true });
  await notify([course.instructor], 'review', `New review for ${course.title}`, `/courses/${course.id}`);
  res.json({ review });
});

module.exports = { list, save };
