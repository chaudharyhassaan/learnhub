const jwt = require('jsonwebtoken');

// Why: one signing helper keeps the token payload and expiry identical everywhere,
// so protected routes only ever have to read { id } from the token.
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = generateToken;
