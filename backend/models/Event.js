const mongoose = require('mongoose');
const { Schema } = mongoose;
const reference = (ref) => ({ type: Schema.Types.ObjectId, ref, required: true });

const schema = new Schema({
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  type: { type: String, required: true, enum: ['lecture', 'assignment', 'exam'] },
  course: reference('Course'), group: { type: Schema.Types.ObjectId, ref: 'Group' },
  startsAt: { type: Date, required: true },
  endsAt: { type: Date, required: true, validate(value) { return value > this.startsAt; } },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  createdBy: reference('User'),
}, { timestamps: true });

schema.index({ course: 1, startsAt: 1 });
module.exports = mongoose.model('Event', schema);
