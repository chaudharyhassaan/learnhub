const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const LearningPath = require('../models/LearningPath');
const asyncHandler = require('../utils/asyncHandler');
const { courseScope, fail } = require('../utils/dashboardAccess');
const { auditAdmin } = require('../utils/dashboardAccess');

// Keep path order and add the signed-in student's progress in one query.
async function formatPaths(user, paths) {
  if (user.role !== 'student') return paths;
  const ids = paths.flatMap(path => path.courses.filter(Boolean).map(course => course._id));
  const enrollments = await Enrollment.find({ student: user.id, course: { $in: ids } }).select('course progress').lean();
  const progress = new Map(enrollments.map(item => [String(item.course), item.progress]));
  return paths.map(path => ({ ...path, courses: path.courses.filter(Boolean).map(course => {
    const value = progress.get(String(course._id));
    const status = value === undefined ? 'not enrolled' : value === 100 ? 'completed' : 'in progress';
    return { ...course, status, progress: value ?? 0 };
  }) }));
}

const list = asyncHandler(async (req, res) => {
  const paths = await LearningPath.find().populate('courses', 'title level').sort({ createdAt: -1 }).lean();
  res.json({ paths: await formatPaths(req.user, paths) });
});

const detail = asyncHandler(async (req, res) => {
  const path = await LearningPath.findById(req.params.id).populate('courses', 'title level').lean();
  if (!path) fail(404, 'Learning path not found.');
  const [formatted] = await formatPaths(req.user, [path]);
  res.json({ path: formatted });
});

async function fields(req) {
  const { title, description = '', courses } = req.body;
  const count = await Course.countDocuments({ ...courseScope(req.user), _id: { $in: courses } });
  if (count !== courses.length) fail(403, 'Choose available courses that you can manage.');
  return { title, description, courses };
}

async function ownedPath(req) {
  const path = await LearningPath.findById(req.params.id);
  if (!path) fail(404, 'Learning path not found.');
  if (req.user.role !== 'admin' && String(path.instructor) !== req.user.id) fail(403, 'You can only manage your own paths.');
  return path;
}

const create = asyncHandler(async (req, res) => {
  const path = await LearningPath.create({ ...await fields(req), instructor: req.user.id });
  await auditAdmin(req, 'create_learning_path', 'LearningPath', path.id, 'Created a learning path.');
  res.status(201).json({ path });
});

const update = asyncHandler(async (req, res) => {
  const path = await ownedPath(req);
  path.set(await fields(req));
  await path.save();
  await auditAdmin(req, 'update_learning_path', 'LearningPath', path.id, 'Updated a learning path.');
  res.json({ path });
});

const remove = asyncHandler(async (req, res) => {
  const path = await ownedPath(req);
  await path.deleteOne();
  await auditAdmin(req, 'delete_learning_path', 'LearningPath', path.id, 'Deleted a learning path.');
  res.json({ message: 'Learning path deleted.' });
});

module.exports = { list, detail, create, update, remove };
