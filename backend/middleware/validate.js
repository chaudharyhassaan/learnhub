const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const removeFile = require('../utils/files');

// Why: controllers should only run on clean input. This turns express-validator
// results into the shared { message, errors } shape the frontend expects.
async function validate(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  // Multer saves the file before validation runs, so a rejected form must not
  // leave an orphan behind in the uploads folder.
  if (req.file) {
    try {
      await removeFile(req.file.filename);
    } catch (error) {
      console.error(`Could not remove rejected upload: ${error.message}`);
    }
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
