const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    totalSeconds: { type: Number, min: 0, default: 0 },
    sessionCount: { type: Number, min: 0, default: 0 },
    lastAccessedAt: Date,
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    progress: {
      type: Number,
      min: [0, 'Progress cannot be below 0'],
      max: [100, 'Progress cannot be above 100'],
      default: 0,
    },
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
  },
  { timestamps: true }
);

// Why: the database itself stops a student from enrolling in the same course twice,
// even if two requests arrive at the same moment.
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ course: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
