const Lesson = require('../models/Lesson');

// Why: progress must stay correct when lessons are added or deleted, so it is
// always recalculated from the database instead of trusting a stored number.
async function recalculateProgress(enrollment) {
  const lessons = await Lesson.find({ course: enrollment.course }).select('_id').lean();

  if (lessons.length === 0) {
    enrollment.progress = 0;
    return enrollment;
  }

  // A completed id that no longer exists must not count towards progress.
  const lessonIds = new Set(lessons.map((lesson) => String(lesson._id)));
  const completed = enrollment.completedLessons.filter((id) => lessonIds.has(String(id)));

  enrollment.progress = Math.round((completed.length / lessons.length) * 100);

  return enrollment;
}

module.exports = recalculateProgress;
