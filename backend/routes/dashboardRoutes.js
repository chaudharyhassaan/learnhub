const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, query } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, validateObjectId } = require('../middleware/validate');
const { text, id, number, queryId } = require('../middleware/dashboardFields');
const events = require('../controllers/eventController');
const groups = require('../controllers/groupController');
const reviews = require('../controllers/reviewController');
const messages = require('../controllers/messageController');
const notifications = require('../controllers/notificationController');
const evaluations = require('../controllers/evaluationController');
const paths = require('../controllers/learningPathController');
const instructor = require('../controllers/instructorController');
const heartbeat = require('../controllers/heartbeatController');
const profile = require('../controllers/profileController');

const router = express.Router();
const manager = authorize('instructor', 'admin');
const student = authorize('student');
const objectId = validateObjectId('id');
// Use the verified account ID, so people sharing a network have separate quotas.
const throttle = limit => rateLimit({
  windowMs: 10 * 60000, limit, standardHeaders: true, legacyHeaders: false,
  keyGenerator: req => req.user.id,
  handler: (req, res) => res.status(429).json({ message: 'Too many requests. Try again in a few minutes.' }),
});

const isoDate = field => field.isString().bail().isISO8601({ strict: true }).bail()
  .custom(value => Number.isFinite(Date.parse(value))).withMessage('Enter a valid ISO date.');
const eventFields = [
  text('title', 2, 120), text('type', 3, 12).isIn(['lecture', 'assignment', 'exam']),
  id('courseId'), id('groupId').optional({ values: 'null' }),
  isoDate(body('startsAt')), isoDate(body('endsAt')),
  text('description', 0, 500).optional(),
];
const groupFields = [text('name', 2, 60), text('meetingLabel', 0, 40).optional()];
const pathFields = [
  text('title', 2, 120), text('description', 0, 500).optional(),
  body('courses').isArray({ min: 2, max: 8 }).bail().custom(values =>
    new Set(values.map(value => String(value).toLowerCase())).size === values.length
  ).withMessage('Choose 2 to 8 different courses.'),
  id('courses.*'),
];

router.get('/courses/:id/reviews', objectId, reviews.list);
router.post('/courses/:id/reviews', protect, student, objectId,
  number('rating', 1, 5, true), text('comment', 0, 500).optional(), validate, reviews.save);
router.patch('/my-courses/:courseId/heartbeat', protect, student, throttle(60),
  validateObjectId('courseId'), number('seconds', 1, 60, true), validate, heartbeat);

router.get('/instructor/overview', protect, manager, instructor.overview);
router.get('/instructor/tracking', protect, manager, queryId('courseId'), validate, instructor.tracking);
router.get('/instructor/students', protect, manager, queryId('courseId'), validate, instructor.students);
router.get('/search', protect, query('q').isString().bail().trim().isLength({ min: 2, max: 50 }), validate, instructor.search);

const dateQuery = name => isoDate(query(name));
router.get('/events', protect, dateQuery('from'), dateQuery('to'), validate, events.list);
router.post('/events', protect, manager, eventFields, validate, events.create);
router.put('/events/:id', protect, manager, objectId, eventFields, validate, events.update);
router.delete('/events/:id', protect, manager, objectId, events.remove);

router.get('/groups', protect, manager, groups.list);
router.get('/my-groups', protect, student, groups.mine);
router.post('/groups', protect, manager, groupFields, id('courseId'), validate, groups.create);
router.put('/groups/:id', protect, manager, objectId, groupFields, id('courseId').optional(), validate, groups.update);
router.delete('/groups/:id', protect, manager, objectId, groups.remove);
router.post('/groups/:id/members', protect, manager, objectId, id('studentId'), validate, groups.addMember);
router.delete('/groups/:id/members/:studentId', protect, manager, objectId, validateObjectId('studentId'), groups.removeMember);

router.post('/messages', protect, throttle(30), id('recipientId'), text('body', 1, 1000), validate, messages.send);
router.get('/messages/contacts', protect, messages.contacts);
router.get('/messages/conversations', protect, messages.conversations);
router.get('/messages/with/:userId', protect, validateObjectId('userId'), messages.thread);

router.get('/notifications', protect, notifications.list);
router.patch('/notifications/read-all', protect, notifications.readAll);
router.patch('/notifications/:id/read', protect, objectId, notifications.read);

router.get('/evaluations', protect, evaluations.list);
router.put('/evaluations', protect, manager, id('courseId'), id('studentId'),
  number('score', 0, 100), text('feedback', 0, 500).optional(), validate, evaluations.save);

router.get('/learning-paths', protect, paths.list);
router.get('/learning-paths/:id', protect, objectId, paths.detail);
router.post('/learning-paths', protect, manager, pathFields, validate, paths.create);
router.put('/learning-paths/:id', protect, manager, objectId, pathFields, validate, paths.update);
router.delete('/learning-paths/:id', protect, manager, objectId, paths.remove);

router.put('/me', protect, text('name', 2, 60), text('headline', 0, 80).optional(), validate, profile.update);
router.put('/me/password', protect, throttle(10),
  body('currentPassword').isString().bail().notEmpty().isLength({ max: 1024 }),
  body('newPassword').isString().bail().isLength({ min: 8 }).matches(/[A-Za-z]/).matches(/[0-9]/)
    .custom(value => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Use a password within the 72-byte limit.'),
  validate, profile.password);

module.exports = router;
