const mongoose = require('mongoose');
const { Schema } = mongoose;
const reference = (ref) => ({ type: Schema.Types.ObjectId, ref, required: true });

const schema = new Schema({
  course: reference('Course'), student: reference('User'),
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 500, default: '' },
}, { timestamps: true });

schema.index({ course: 1, student: 1 }, { unique: true });
module.exports = mongoose.model('Review', schema);
