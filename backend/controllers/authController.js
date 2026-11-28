const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

// Why: the client only ever sees these four fields, never the hash or internal fields.
function publicUser(user) {
  return {
    id: user._id.toString(),
    headline: user.headline || '',
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

// POST /api/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const role = req.body.role || 'student';

  // The validator checks this too, but the server stays the final gate:
  // a client can never create an admin account through the API.
  if (role !== 'student' && role !== 'instructor') {
    return res.status(400).json({ message: 'Role must be student or instructor' });
  }

  // Email is stored lowercase so "Test@" and "test@" cannot become two accounts.
  const normalisedEmail = String(email).trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalisedEmail });

  if (existingUser) {
    return res.status(409).json({
      message: 'An account with this email already exists. Try logging in.',
    });
  }

  let user;

  try {
    // Whitelisted fields only. Never pass req.body straight into create.
    user = await User.create({
      name: String(name).trim(),
      email: normalisedEmail,
      password,
      role,
    });
  } catch (error) {
    // Two requests can pass the check above at the same time, so the unique index
    // is the real guard and its duplicate error gets the same friendly message.
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists. Try logging in.',
      });
    }

    throw error;
  }

  const token = generateToken(user._id);

  return res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/login
const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const { password } = req.body;

  // The schema hides the password by default, so ask for it only here.
  const user = await User.findOne({ email }).select('+password');

  // Unknown email and wrong password give the same answer, so accounts cannot be probed.
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = generateToken(user._id);

  return res.status(200).json({ token, user: publicUser(user) });
});

// GET /api/me
// Why: the frontend calls this on load to restore a session from a stored token.
const getMe = asyncHandler(async (req, res) => {
  return res.status(200).json({ user: publicUser(req.user) });
});

module.exports = { register, login, getMe };
