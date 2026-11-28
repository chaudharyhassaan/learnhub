const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

// Why: one account shape for all three roles, so login and authorisation
// only have to look at the role field.
const userSchema = new mongoose.Schema(
  {
    headline: { type: String, trim: true, maxlength: 80, default: '' },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot be longer than 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      // select: false keeps the hash out of normal queries, so it is never sent by mistake.
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: 'Role must be admin, instructor or student',
      },
      default: 'student',
    },
  },
  { timestamps: true }
);

// Why: hashing here means every save path stores a safe hash, not a plain password.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

// Used by the login controller to compare the typed password with the stored hash.
userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Why: the hash and version key must never leave the server in a JSON response.
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
