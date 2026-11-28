const mongoose = require('mongoose');
const { Schema } = mongoose;
const reference = (ref) => ({ type: Schema.Types.ObjectId, ref, required: true });

const schema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
  course: reference('Course'), instructor: reference('User'),
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  meetingLabel: { type: String, trim: true, maxlength: 40, default: '' },
}, { timestamps: true });

schema.index({ instructor: 1 });
module.exports = mongoose.model('Group', schema);
