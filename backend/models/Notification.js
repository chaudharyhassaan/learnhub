const mongoose = require('mongoose');
const { Schema } = mongoose;
const reference = (ref) => ({ type: Schema.Types.ObjectId, ref, required: true });

const schema = new Schema({
  user: reference('User'),
  type: { type: String, required: true },
  text: { type: String, required: true },
  link: { type: String, required: true },
  readAt: Date,
}, { timestamps: true });

schema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model('Notification', schema);
