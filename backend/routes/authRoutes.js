const express = require('express');
const { body } = require('express-validator');

const { register, login, getMe } = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// Shared rules for a new account. Messages say how to fix the field.
const registerRules = [
  body('name')
    .isString()
    .withMessage('Name is required.')
    .bail()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be 2 to 60 characters.'),
  body('email')
    .isString()
    .withMessage('Email is required.')
    .bail()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address.'),
  body('password')
    .isString()
    .withMessage('Password is required.')
    .bail()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Za-z]/)
    .withMessage('Password must include at least one letter.')
    .matches(/[0-9]/)
    .withMessage('Password must include at least one number.'),
  body('role')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Role must be student or instructor')
    .isIn(['student', 'instructor'])
    .withMessage('Role must be student or instructor'),
];

// Login only checks that both values are text. That blocks objects such as
// { "$gt": "" }, which is the classic NoSQL injection attempt.
const loginRules = [
  body('email')
    .isString()
    .withMessage('Please enter your email.')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Please enter your email.'),
  body('password')
    .isString()
    .withMessage('Please enter your password.')
    .bail()
    .notEmpty()
    .withMessage('Please enter your password.'),
];

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/me', protect, getMe);

module.exports = router;
