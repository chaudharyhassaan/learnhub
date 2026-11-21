// Why: every unmatched URL ends here, so the API always answers with JSON
// instead of Express's default HTML page.
function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

// Why: one place turns thrown errors into the { message } shape the frontend expects.
// next must stay in the signature even when unused, because Express only treats
// a middleware with four arguments as an error handler.
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again.';

  // Mongoose validation: tell the form which fields to fix.
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.keys(err.errors).forEach((field) => {
      errors[field] = err.errors[field].message;
    });

    return res.status(400).json({
      message: 'Please check the highlighted fields.',
      errors,
    });
  }

  // A malformed id reached a query, for example /api/courses/abc.
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }

  // The unique indexes (email, student plus course) rejected a duplicate.
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That record already exists.' });
  }

  // Multer errors (file too large, wrong field name and so on).
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message });
  }

  // Unknown server errors are logged for the developer, but the response stays vague
  // in production so internal details never leak to a user.
  if (statusCode >= 500) {
    console.error(err);

    if (process.env.NODE_ENV === 'production') {
      message = 'Something went wrong. Please try again.';
    }
  }

  return res.status(statusCode).json({ message });
}

module.exports = { notFound, errorHandler };
