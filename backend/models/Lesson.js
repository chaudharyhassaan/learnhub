const mongoose = require('mongoose');
const { LESSON_TYPES } = require('../utils/constants');

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot be longer than 120 characters'],
    },
    type: {
      type: String,
      enum: {
        values: LESSON_TYPES,
        message: 'Type must be video, pdf, image or link',
      },
      required: [true, 'Type is required'],
    },
    // Why: uploads live outside the public folder, so only the stored file name
    // is saved here. The real path is built on the server when the file is served.
    filePath: {
      type: String,
      default: '',
    },
    originalName: {
      type: String,
      default: '',
    },
    mimeType: {
      type: String,
      default: '',
    },
    size: {
      type: Number,
      default: 0,
    },
    contentUrl: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lesson', lessonSchema);
