const Event = require('./models/Event');
const Group = require('./models/Group');
const Review = require('./models/Review');
const Message = require('./models/Message');
const Notification = require('./models/Notification');
const Evaluation = require('./models/Evaluation');
const LearningPath = require('./models/LearningPath');

const collections = [Event, Group, Review, Message, Notification, Evaluation, LearningPath];

// Use Karachi wall-clock hours for the demo schedule regardless of the seed host's timezone.
function scheduleTime(now, dayOffset, hour) {
  const local = new Date(now.getTime() + 5 * 3600000);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + dayOffset, hour - 5));
}

async function seedDashboard({ instructors, students, courses, enrollments, now }) {
  const instructor = instructors[0]._id;
  const groupSpecs = [
    ['React Study Circle', 0, 'Today 11am-1pm'],
    ['Design Studio', 2, 'Today 2pm-4pm'],
    ['Excel Lab', 4, 'Tomorrow 10am-11am'],
    ['Spanish Practice', 6, 'Friday 4pm-5pm'],
  ];
  await Group.insertMany(groupSpecs.map(([name, index, meetingLabel]) => {
    const course = courses[index]._id;
    return { name, course, instructor, meetingLabel,
      members: enrollments.filter(row => row.course.equals(course)).map(row => row.student) };
  }));

  const timetable = [
    ['Lecture - Design Fundamentals', 'lecture', 2, 0, 11, 12],
    ['Lecture - Basics of Game Design', 'lecture', 2, 0, 14, 16],
    ['React practice assignment', 'assignment', 0, 0, 17, 18],
    ['Excel formulas workshop', 'lecture', 4, 1, 10, 11],
    ['React component review', 'exam', 0, 3, 13, 14],
    ['Spanish conversation practice', 'lecture', 6, 5, 15, 16],
  ];
  const events = await Event.insertMany(timetable.map(([title, type, index, day, start, end]) => ({
    title, type, course: courses[index]._id, startsAt: scheduleTime(now, day, start),
    endsAt: scheduleTime(now, day, end), createdBy: instructor,
  })));

  const active = enrollments.filter(row => row.progress > 0);
  await Review.insertMany(active.map((row, index) => ({
    course: row.course, student: row.student, rating: 5 - index % 2,
    comment: index % 2 ? 'The examples made the lessons easy to follow.' : 'Clear lessons with practical exercises.',
  })));
  await Evaluation.insertMany(active.slice(0, 4).map((row, index) => ({
    course: row.course, student: row.student,
    instructor: courses.find(course => course._id.equals(row.course)).instructor,
    score: 85 + index * 3, feedback: 'Good work. Revisit the practice exercise before the next lesson.',
  })));

  const sara = students[0]._id;
  const messages = [
    { sender: sara, recipient: instructor, body: 'Will we review the design exercise in the next session?' },
    { sender: instructor, recipient: sara, body: 'Yes. Bring your draft so we can discuss it together.' },
    { sender: students[1]._id, recipient: instructor, body: 'I finished the React practice exercise.' },
  ];
  await Promise.all([
    Message.insertMany(messages),
    Notification.insertMany([
      ...messages.map(message => ({
        user: message.recipient, type: 'message', text: 'You have a new message.', link: '/dashboard/inbox',
      })),
      { user: sara, type: 'event', text: events[0].title, link: '/dashboard/schedule' },
      { user: instructor, type: 'review', text: 'New review for React Fundamentals', link: '/courses/' + courses[0].id },
    ]),
    LearningPath.insertMany([
      { title: 'Design and build for the web', description: 'Learn interface design, then build a React application.',
        instructor, courses: [courses[2]._id, courses[0]._id] },
      { title: 'Practical data and communication', description: 'Build spreadsheet skills and practice communicating results.',
        instructor, courses: [courses[4]._id, courses[6]._id] },
    ]),
  ]);
}

module.exports = { collections, seedDashboard };
