const mongoose = require('mongoose');
const { Schema } = mongoose;
const reference = (ref) => ({ type: Schema.Types.ObjectId, ref, required: true });

const schema = new Schema({
  course: reference('Course'), student: reference('User'), instructor: reference('User'),
  score: { type: Number, required: true, min: 0, max: 100 },
  feedback: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true });

schema.index({ course: 1, student: 1 }, { unique: true });
module.exports = mongoose.model('Evaluation', schema);
