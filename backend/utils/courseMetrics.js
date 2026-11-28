const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Review = require('../models/Review');

// Aggregate related records once per page and fill defaults for older courses.
async function courseMetrics(courses) {
  if (!courses.length) return courses;
  const filter = { $match: { course: { $in: courses.map(course => course._id) } } };
  const [lessons, students, reviews] = await Promise.all([
    Lesson.aggregate([filter, { $group: { _id: '$course', count: { $sum: 1 } } }]),
    Enrollment.aggregate([filter, { $group: { _id: '$course', count: { $sum: 1 }, progress: { $avg: '$progress' } } }]),
    Review.aggregate([filter, { $group: { _id: '$course', count: { $sum: 1 }, average: { $avg: '$rating' } } }]),
  ]);
  const byCourse = rows => new Map(rows.map(row => [String(row._id), row]));
  const lessonCounts = byCourse(lessons);
  const studentCounts = byCourse(students);
  const ratings = byCourse(reviews);
  return courses.map(course => {
    const id = String(course._id);
    const studentCount = studentCounts.get(id)?.count ?? 0;
    return {
      ...course, level: course.level ?? 'Basic', durationHours: course.durationHours ?? 0,
      originalPrice: course.originalPrice ?? 0, lessonCount: lessonCounts.get(id)?.count ?? 0,
      studentCount, enrolledCount: studentCount,
      completionRate: Math.round(studentCounts.get(id)?.progress ?? 0),
      ratingCount: ratings.get(id)?.count ?? 0, ratingAverage: Math.round((ratings.get(id)?.average ?? 0) * 10) / 10,
    };
  });
}

module.exports = courseMetrics;
