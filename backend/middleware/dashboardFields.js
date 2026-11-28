const { body, query } = require('express-validator');

// Check types before trimming or coercing request values.
const text = (name, min, max) => body(name).isString().bail().trim()
  .isLength({ min, max }).withMessage(`Use ${min} to ${max} characters.`);
const id = name => body(name).isString().bail().isMongoId().withMessage('Choose a valid item.');
const queryId = name => query(name).optional().isString().bail().isMongoId().withMessage('Choose a valid course.');
const number = (name, min, max, integer = false) => {
  const field = body(name).custom(value => typeof value === 'number' && Number.isFinite(value)).bail();
  return (integer ? field.isInt({ min, max }) : field.isFloat({ min, max }))
    .withMessage(`Enter a number from ${min} to ${max}.`);
};

module.exports = { text, id, queryId, number };
