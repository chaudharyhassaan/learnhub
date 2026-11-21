// Shared lists used by the models, validators and seed script.
// Keeping them here means a new role or category only has to be added once.
const ROLES = ['admin', 'instructor', 'student'];

const CATEGORIES = [
  'Programming',
  'Design',
  'Business',
  'Marketing',
  'Data',
  'Language',
  'Other',
];

const LESSON_TYPES = ['video', 'pdf', 'image', 'link'];

module.exports = { ROLES, CATEGORIES, LESSON_TYPES };
