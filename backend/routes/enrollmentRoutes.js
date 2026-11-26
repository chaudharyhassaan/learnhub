const express = require('express');
const { body } = require('express-validator');

const {
  enroll,
  getMyCourses,
  getMyCourse,
  updateLessonProgress,
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, validateObjectId } = require('../middleware/validate');

const router = express.Router();

// A course id in the body still needs the same ObjectId check as a param.
const enrollRules = [
  body('courseId').isMongoId().withMessage('Please choose a valid course.'),
];

// Strict boolean: strings like "true" are rejected so the frontend sends real booleans.
const progressRules = [
  body('completed')
    .custom((value) => typeof value === 'boolean')
    .withMessage('Completed must be true or false.'),
];

// Every route here is for students only. Instructors and admins get 403.
router.post('/enroll', protect, authorize('student'), enrollRules, validate, enroll);

router.get('/my-courses', protect, authorize('student'), getMyCourses);

router.get(
  '/my-courses/:courseId',
  protect,
  authorize('student'),
  validateObjectId('courseId'),
  getMyCourse
);

router.patch(
  '/my-courses/:courseId/lessons/:lessonId',
  protect,
  authorize('student'),
  validateObjectId('courseId'),
  validateObjectId('lessonId'),
  progressRules,
  validate,
  updateLessonProgress
);

module.exports = router;
