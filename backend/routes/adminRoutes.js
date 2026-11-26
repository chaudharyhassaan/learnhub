const express = require('express');
const { body, query } = require('express-validator');

const {
  listUsers,
  changeUserRole,
  deleteUser,
  getAnalytics,
  getAuditLogs,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, validateObjectId } = require('../middleware/validate');
const { ROLES } = require('../utils/constants');

const router = express.Router();

// One gate for the whole admin area, so no route can forget it.
router.use(protect, authorize('admin'));

const listRules = [
  query('search')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('Search must be text.'),
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

const roleRules = [
  body('role')
    .isIn(ROLES)
    .withMessage('Role must be admin, instructor or student.'),
];

router.get('/users', listRules, validate, listUsers);

router.patch(
  '/users/:id/role',
  validateObjectId('id'),
  roleRules,
  validate,
  changeUserRole
);

router.delete('/users/:id', validateObjectId('id'), deleteUser);

router.get('/analytics', getAnalytics);

router.get('/audit-logs', getAuditLogs);

module.exports = router;
