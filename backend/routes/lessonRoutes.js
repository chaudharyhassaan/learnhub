const express = require('express');
const { body } = require('express-validator');

const {
  getCourseLessons,
  createLesson,
  deleteLesson,
  getLessonAccess,
  getFile,
} = require('../controllers/lessonController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, validateObjectId } = require('../middleware/validate');
const { upload } = require('../middleware/upload');

const router = express.Router();

// Title and optional link are checked after Multer has parsed the form fields.
const lessonRules = [
  body('title')
    .isString()
    .withMessage('Title is required.')
    .bail()
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Title must be 2 to 120 characters.'),
  body('contentUrl')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Content URL must be a link.')
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Content URL must start with http:// or https://.'),
];

// Public: the course page shows the lesson list before anyone logs in.
router.get(
  '/courses/:courseId/lessons',
  validateObjectId('courseId'),
  getCourseLessons
);

// Protected: upload a file or add a link. validateObjectId runs before Multer,
// so a bad course id never leaves a file on disk.
router.post(
  '/courses/:courseId/lessons',
  protect,
  authorize('instructor', 'admin'),
  validateObjectId('courseId'),
  upload.single('file'),
  lessonRules,
  validate,
  createLesson
);

// Access returns the short lived signed file link.
router.get('/lessons/:id/access', protect, validateObjectId('id'), getLessonAccess);

// Delete is open to any logged in user here, but the controller only allows the
// course owner or an admin.
router.delete('/lessons/:id', protect, validateObjectId('id'), deleteLesson);

// No auth header: the signature inside the token is the authorisation.
router.get('/files/:token', getFile);

module.exports = router;
