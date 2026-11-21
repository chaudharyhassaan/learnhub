const express = require('express');
const { body, query } = require('express-validator');

const {
  listCourses,
  listMyCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, validateObjectId } = require('../middleware/validate');
const { CATEGORIES } = require('../utils/constants');

const router = express.Router();

// Query rules for the public course list. Bad values are rejected instead of
// silently ignored, so the frontend can show the problem.
const listRules = [
  query('search')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Search must be text.'),
  query('category')
    .optional({ values: 'falsy' })
    .isIn(CATEGORIES)
    .withMessage('Please choose a valid category.'),
  query('sort')
    .optional({ values: 'falsy' })
    .isIn(['newest', 'price_asc', 'price_desc'])
    .withMessage('Sort must be newest, price_asc or price_desc.'),
  query('page')
    .optional({ values: 'falsy' })
    .isInt({ min: 1 })
    .withMessage('Page must be a whole number of 1 or more.')
    .toInt(),
  query('limit')
    .optional({ values: 'falsy' })
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be a whole number from 1 to 50.')
    .toInt(),
];

// Rules for creating a course. Every required field is checked here.
const createRules = [
  body('title')
    .isString()
    .withMessage('Title is required.')
    .bail()
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage('Title must be 3 to 120 characters.'),
  body('description')
    .isString()
    .withMessage('Description is required.')
    .bail()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be 10 to 2000 characters.'),
  body('category')
    .isIn(CATEGORIES)
    .withMessage('Please choose a valid category.'),
  body('price')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Price must be a number of 0 or more.')
    .toFloat(),
  body('thumbnail')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Thumbnail must be a link.')
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Thumbnail must start with http:// or https://.'),
];

// Rules for editing. Every field is optional, but anything sent is still checked.
const updateRules = [
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be text.')
    .bail()
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage('Title must be 3 to 120 characters.'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be text.')
    .bail()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be 10 to 2000 characters.'),
  body('category')
    .optional()
    .isIn(CATEGORIES)
    .withMessage('Please choose a valid category.'),
  body('price')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Price must be a number of 0 or more.')
    .toFloat(),
  body('thumbnail')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Thumbnail must be a link.')
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Thumbnail must start with http:// or https://.'),
];

// Public list. /mine must be declared before /:id or Express would treat
// "mine" as an id.
router.get('/', listRules, validate, listCourses);

router.get('/mine', protect, authorize('instructor', 'admin'), listMyCourses);

router.get('/:id', validateObjectId('id'), getCourse);

router.post(
  '/',
  protect,
  authorize('instructor', 'admin'),
  createRules,
  validate,
  createCourse
);

router.put(
  '/:id',
  protect,
  authorize('instructor', 'admin'),
  validateObjectId('id'),
  updateRules,
  validate,
  updateCourse
);

router.delete(
  '/:id',
  protect,
  authorize('instructor', 'admin'),
  validateObjectId('id'),
  deleteCourse
);

module.exports = router;
