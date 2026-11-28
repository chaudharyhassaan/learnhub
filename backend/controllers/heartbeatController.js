const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const { fail } = require('../utils/dashboardAccess');

// Update the inactivity threshold and counters atomically across multiple tabs.
module.exports = asyncHandler(async (req, res) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 10 * 60 * 1000);
  const enrollment = await Enrollment.findOneAndUpdate(
    { course: req.params.courseId, student: req.user.id },
    [{ $set: {
      totalSeconds: { $add: [{ $ifNull: ['$totalSeconds', 0] }, req.body.seconds] },
      sessionCount: { $add: [{ $ifNull: ['$sessionCount', 0] }, {
        $cond: [{ $lt: [{ $ifNull: ['$lastAccessedAt', new Date(0)] }, cutoff] }, 1, 0],
      }] },
      lastAccessedAt: now,
    } }],
    { new: true, updatePipeline: true }
  ).select('totalSeconds sessionCount lastAccessedAt').lean();
  if (!enrollment) fail(404, 'You are not enrolled in this course.');
  res.json(enrollment);
});
