const Course = require('../models/Course');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Why: the landing page shows three simple numbers to visitors, so this route
// stays public and only returns counts, never personal data.
const getStats = asyncHandler(async (req, res) => {
  const [courses, learners, instructors] = await Promise.all([
    Course.countDocuments(),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'instructor' }),
  ]);

  return res.status(200).json({ courses, learners, instructors });
});

module.exports = { getStats };
