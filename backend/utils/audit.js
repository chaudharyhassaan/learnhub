const AuditLog = require('../models/AuditLog');

// Why: admin actions must leave a trail. A logging failure is reported in the
// console but never breaks the action the admin already completed.
async function logAdminAction(req, action, targetType, targetId, details = '') {
  try {
    await AuditLog.create({
      actor: req.user.id,
      action,
      targetType,
      targetId,
      details,
    });
  } catch (error) {
    console.error(`Could not write audit log: ${error.message}`);
  }
}

module.exports = logAdminAction;
