const mongoose = require('mongoose');
const { Schema } = mongoose;
const reference = (ref) => ({ type: Schema.Types.ObjectId, ref, required: true });

const schema = new Schema({
  sender: reference('User'), recipient: reference('User'),
  body: { type: String, required: true, trim: true, maxlength: 1000 },
  readAt: Date,
}, { timestamps: true });

schema.index({ sender: 1, recipient: 1, createdAt: -1 });
schema.index({ recipient: 1, sender: 1, readAt: 1 });
module.exports = mongoose.model('Message', schema);
