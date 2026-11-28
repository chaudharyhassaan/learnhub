const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const log = require('../utils/audit');
const { fail } = require('../utils/dashboardAccess');

// Whitelist profile fields and leave account email and role under existing controls.
const update = asyncHandler(async (req, res) => {
  const user = req.user;
  user.name = req.body.name;
  if (req.body.headline !== undefined) user.headline = req.body.headline;
  await user.save();
  if (user.role === 'admin') await log(req, 'update_profile', 'User', user.id, 'Updated own profile.');
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, headline: user.headline || '' } });
});

const password = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');
  if (!user || !await user.comparePassword(req.body.currentPassword)) fail(400, 'Current password is incorrect.');
  user.password = req.body.newPassword;
  await user.save();
  if (user.role === 'admin') await log(req, 'update_password', 'User', user.id, 'Changed own password.');
  res.json({ message: 'Password updated.' });
});

module.exports = { update, password };
