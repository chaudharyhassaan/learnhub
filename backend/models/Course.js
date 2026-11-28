const mongoose = require('mongoose');
const { CATEGORIES } = require('../utils/constants');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot be longer than 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot be longer than 2000 characters'],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Instructor is required'],
    },
    category: {
      type: String,
      enum: {
        values: CATEGORIES,
        message: 'Please choose a valid category',
      },
      required: [true, 'Category is required'],
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: 0,
    },
    thumbnail: {
      type: String,
      default: '',
    },
    level: { type: String, enum: ['Basic', 'Intermediate', 'Advanced'], default: 'Basic' },
    durationHours: { type: Number, min: 0, default: 0 },
    originalPrice: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

// Fast lookup of "courses by this instructor" on the instructor dashboard.
courseSchema.index({ instructor: 1 });

// Text index so the course list can support a keyword search later.
courseSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Course', courseSchema);
