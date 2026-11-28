const mongoose = require('mongoose');
const { Schema } = mongoose;
const reference = (ref) => ({ type: Schema.Types.ObjectId, ref, required: true });

const schema = new Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  instructor: reference('User'),
  courses: { type: [Schema.Types.ObjectId], ref: 'Course', validate(value) {
    return value.length >= 2 && value.length <= 8 && new Set(value.map(String)).size === value.length;
  } },
}, { timestamps: true });

schema.index({ instructor: 1 });
module.exports = mongoose.model('LearningPath', schema);
