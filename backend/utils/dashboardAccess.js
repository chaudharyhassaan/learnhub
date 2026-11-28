const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const log = require('./audit');

// Apply the same ownership checks to all course-linked management endpoints.
function fail(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function courseScope(user) {
  return user.role === 'admin' ? {} : { instructor: user.id };
}

async function ownedCourse(user, id) {
  const course = await Course.findById(id).lean();
  if (!course) fail(404, 'Course not found.');
  if (user.role !== 'admin' && String(course.instructor) !== user.id) {
    fail(403, 'You can only manage your own courses.');
  }
  return course;
}

async function requireEnrollment(course, student) {
  if (!await Enrollment.exists({ course, student })) fail(403, 'The student is not enrolled in this course.');
}

async function requireStudentEnrollment(course, student) {
  if (!await User.exists({ _id: student, role: 'student' })) fail(403, 'Choose an enrolled student.');
  await requireEnrollment(course, student);
}

function auditAdmin(req, action, type, id, details) {
  if (req.user.role === 'admin') return log(req, action, type, id, details);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { fail, courseScope, ownedCourse, requireEnrollment, requireStudentEnrollment, auditAdmin, escapeRegex };
