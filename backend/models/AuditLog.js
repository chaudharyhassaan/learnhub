const mongoose = require('mongoose');

// Why: admin actions need a permanent trail for the security rules, and this
// collection is append-only by convention (no update or delete routes).
const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
    },
    targetType: {
      type: String,
      default: '',
      trim: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
