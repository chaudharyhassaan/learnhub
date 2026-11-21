const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Small helper so every auth failure carries the status the error handler needs.
function authError(message) {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
}

// Why: protected routes must know who is calling them. The token only proves the id,
// so the user is loaded fresh from the database and a deleted account is locked out.
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    throw authError('Please log in to continue.');
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    throw authError('Please log in to continue.');
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw authError('Your session has expired. Please log in again.');
    }

    throw authError('Please log in to continue.');
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    throw authError('Please log in to continue.');
  }

  // Controllers read the user from here and never from the request body.
  req.user = user;
  next();
});

module.exports = { protect };
