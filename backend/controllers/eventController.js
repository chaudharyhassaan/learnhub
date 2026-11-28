const Course = require('../models/Course');
const Group = require('../models/Group');
const Event = require('../models/Event');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const { fail, courseScope, ownedCourse } = require('../utils/dashboardAccess');
const notify = require('../utils/notify');
const { auditAdmin } = require('../utils/dashboardAccess');

// Keep calendar results within the requested window and the user's course scope.
const list = asyncHandler(async (req, res) => {
  const from = new Date(req.query.from);
  const to = new Date(req.query.to);
  if (to <= from || to - from > 62 * 86400000) fail(400, 'Choose a date range of up to 62 days.');
  const filter = { startsAt: { $lt: to }, endsAt: { $gt: from } };
  if (req.user.role === 'student') {
    const courses = await Enrollment.distinct('course', { student: req.user.id });
    const groups = await Group.distinct('_id', { members: req.user.id, course: { $in: courses } });
    filter.course = { $in: courses };
    filter.$or = [{ group: null }, { group: { $in: groups } }];
  } else if (req.user.role === 'instructor') {
    filter.course = { $in: await Course.distinct('_id', courseScope(req.user)) };
  }
  const events = await Event.find(filter).populate('course', 'title').sort({ startsAt: 1 }).lean();
  res.json({ events });
});

async function eventFields(req) {
  const { title, type, courseId, groupId, startsAt, endsAt, description } = req.body;
  const course = await ownedCourse(req.user, courseId);
  if (new Date(endsAt) <= new Date(startsAt)) fail(400, 'End time must be after start time.');
  const group = groupId ? await Group.findOne({ _id: groupId, course: course._id }).lean() : null;
  if (groupId && !group) fail(400, 'Choose a group from the selected course.');
  return { values: { title, type, course: course._id, group: group?._id, startsAt, endsAt, description }, group };
}

const create = asyncHandler(async (req, res) => {
  const { values, group } = await eventFields(req);
  const event = await Event.create({ ...values, createdBy: req.user.id });
  const filter = { course: event.course };
  if (group) filter.student = { $in: group.members };
  await notify(await Enrollment.distinct('student', filter), 'event', event.title, '/dashboard/schedule');
  await auditAdmin(req, 'create_event', 'Event', event.id, 'Created a schedule event.');
  res.status(201).json({ event });
});

async function findEvent(req) {
  const event = await Event.findById(req.params.id);
  if (!event) fail(404, 'Event not found.');
  await ownedCourse(req.user, event.course);
  return event;
}

const update = asyncHandler(async (req, res) => {
  const event = await findEvent(req);
  const { values } = await eventFields(req);
  event.set(values);
  await event.save();
  await auditAdmin(req, 'update_event', 'Event', event.id, 'Updated a schedule event.');
  res.json({ event });
});

const remove = asyncHandler(async (req, res) => {
  const event = await findEvent(req);
  await event.deleteOne();
  await auditAdmin(req, 'delete_event', 'Event', event.id, 'Deleted a schedule event.');
  res.json({ message: 'Event deleted.' });
});

module.exports = { list, create, update, remove };
