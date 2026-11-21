const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Why: controllers should only run on clean input. This turns express-validator
// results into the shared { message, errors } shape the frontend expects.
function validate(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = {};

  result.array().forEach((error) => {
    // Keep the first message per field so the form has one clear hint per input.
    if (!errors[error.path]) {
      errors[error.path] = error.msg;
    }
  });

  return res.status(400).json({
    message: 'Please fix the highlighted fields.',
    errors,
  });
}

// Why: a malformed id would otherwise reach Mongoose and throw a CastError.
// Only 24 character hex strings are accepted as ObjectIds.
function validateObjectId(paramName) {
  return function checkObjectId(req, res, next) {
    const id = req.params[paramName];

    if (!mongoose.isObjectIdOrHexString(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    next();
  };
}

module.exports = { validate, validateObjectId };
