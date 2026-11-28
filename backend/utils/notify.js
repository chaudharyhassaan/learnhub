const Notification = require('../models/Notification');

// A failed alert should never make a saved mutation look like it failed.
async function notify(users, type, text, link) {
  try {
    const uniqueUsers = [...new Set(users.filter(Boolean).map(String))];
    if (uniqueUsers.length) {
      await Notification.insertMany(uniqueUsers.map(user => ({ user, type, text, link })));
    }
  } catch {
    console.error('Could not save dashboard notifications.');
  }
}

module.exports = notify;
