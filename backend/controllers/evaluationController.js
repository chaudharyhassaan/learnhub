const Course = require('../models/Course');
const Evaluation = require('../models/Evaluation');
const asyncHandler = require('../utils/asyncHandler');
const { ownedCourse, requireStudentEnrollment, courseScope } = require('../utils/dashboardAccess');
const notify = require('../utils/notify');
const { auditAdmin } = require('../utils/dashboardAccess');

// Enrollment is checked before saving feedback for a student.
const save = asyncHandler(async (req, res) => {
  const { courseId, studentId, score, feedback = '' } = req.body;
  const course = await ownedCourse(req.user, courseId);
  await requireStudentEnrollment(courseId, studentId);
  const evaluation = await Evaluation.findOneAndUpdate({ course: courseId, student: studentId },
    { $set: { instructor: course.instructor, score, feedback } },
    { new: true, upsert: true, runValidators: true });
  await notify([studentId], 'evaluation', `New evaluation for ${course.title}`, `/learn/${courseId}`);
  await auditAdmin(req, 'save_evaluation', 'Evaluation', evaluation.id, 'Saved a student evaluation.');
  res.json({ evaluation });
});

const list = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'student') filter = { student: req.user.id };
  if (req.user.role === 'instructor') {
    filter = { course: { $in: await Course.distinct('_id', courseScope(req.user)) } };
  }
  const evaluations = await Evaluation.find(filter).populate('course', 'title')
    .populate('student', 'name').sort({ updatedAt: -1 }).lean();
  res.json({ evaluations });
});

module.exports = { list, save };
