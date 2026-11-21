const rateLimit = require('express-rate-limit');

// One response shape for both limiters, so a blocked request still looks like the API.
function limitHandler(req, res) {
  res.status(429).json({
    message: 'Too many attempts. Please wait a few minutes and try again.',
  });
}

// Broad protection for the whole API: 100 requests per 15 minutes per IP.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
});

// Stricter limit on login and register to slow down password guessing: 10 per 15 minutes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler,
});

module.exports = { apiLimiter, authLimiter };
