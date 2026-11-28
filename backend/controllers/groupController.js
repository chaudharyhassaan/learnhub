const Group = require('../models/Group');
const Event = require('../models/Event');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const { fail, ownedCourse, courseScope, requireStudentEnrollment } = require('../utils/dashboardAccess');
const { auditAdmin } = require('../utils/dashboardAccess');

// Check the linked course so admins and instructors use a single ownership rule.
async function findGroup(user, id) {
  const group = await Group.findById(id);
  if (!group) fail(404, 'Group not found.');
  await ownedCourse(user, group.course);
  return group;
}

const list = asyncHandler(async (req, res) => {
  const groups = await Group.find(courseScope(req.user)).populate('course', 'title')
    .populate('members', 'name').sort({ createdAt: -1 }).lean();
  res.json({ groups });
});

const mine = asyncHandler(async (req, res) => {
  const courses = await Enrollment.distinct('course', { student: req.user.id });
  const groups = await Group.find({ course: { $in: courses }, members: req.user.id })
    .populate('course', 'title').populate('members', 'name').lean();
  res.json({ groups });
});

const create = asyncHandler(async (req, res) => {
  const { name, courseId, meetingLabel } = req.body;
  const course = await ownedCourse(req.user, courseId);
  const group = await Group.create({ name, course: course._id, instructor: course.instructor, meetingLabel });
  await auditAdmin(req, 'create_group', 'Group', group.id, 'Created a course group.');
  res.status(201).json({ group });
});

const update = asyncHandler(async (req, res) => {
  const group = await findGroup(req.user, req.params.id);
  const { name, meetingLabel, courseId } = req.body;
  if (courseId && String(group.course) !== courseId) fail(400, 'Create a new group to use a different course.');
  group.name = name;
  group.meetingLabel = meetingLabel ?? group.meetingLabel;
  await group.save();
  await auditAdmin(req, 'update_group', 'Group', group.id, 'Updated a course group.');
  res.json({ group });
});

const remove = asyncHandler(async (req, res) => {
  const group = await findGroup(req.user, req.params.id);
  // Group-only events must not turn into course-wide events.
  await Event.deleteMany({ group: group._id });
  await group.deleteOne();
  await auditAdmin(req, 'delete_group', 'Group', group.id, 'Deleted a course group.');
  res.json({ message: 'Group deleted.' });
});

const addMember = asyncHandler(async (req, res) => {
  const group = await findGroup(req.user, req.params.id);
  const student = req.body.studentId;
  await requireStudentEnrollment(group.course, student);
  await Group.updateOne({ _id: group._id }, { $addToSet: { members: student } });
  await auditAdmin(req, 'add_group_member', 'Group', group.id, 'Added a group member.');
  res.json({ message: 'Member added.' });
});

const removeMember = asyncHandler(async (req, res) => {
  const group = await findGroup(req.user, req.params.id);
  await Group.updateOne({ _id: group._id }, { $pull: { members: req.params.studentId } });
  await auditAdmin(req, 'remove_group_member', 'Group', group.id, 'Removed a group member.');
  res.json({ message: 'Member removed.' });
});

module.exports = { list, mine, create, update, remove, addMember, removeMember };
