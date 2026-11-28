// Why: dotenv first, so the seed uses exactly the same .env as the server.
if (!process.argv.includes('--env-only')) require('dotenv').config();

const mongoose = require('mongoose');

const connectDB = require('./config/db');
const User = require('./models/User');
const Course = require('./models/Course');
const Lesson = require('./models/Lesson');
const Enrollment = require('./models/Enrollment');
const AuditLog = require('./models/AuditLog');
const { collections, seedDashboard } = require('./seedDashboard');

// Seeding deletes everything, so production needs an explicit opt in.
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
  console.error('Refusing to seed while NODE_ENV=production. Add --force only if you are sure.');
  process.exit(1);
}

const DEMO_PASSWORD = 'Password123';

const instructorData = [
  { name: 'Amina Khan', email: 'amina@learnhub.test', headline: 'Design and web development instructor' },
  { name: 'Daniel Okafor', email: 'daniel@learnhub.test', headline: 'Backend development instructor' },
];

const studentData = [
  { name: 'Sara Ahmed', email: 'sara@learnhub.test' },
  { name: 'Ali Hassan', email: 'ali@learnhub.test' },
  { name: 'Mei Lin', email: 'mei@learnhub.test' },
  { name: 'Tom Becker', email: 'tom@learnhub.test' },
];

// instructorIndex points at the instructors array above.
const courseData = [
  {
    title: 'React Fundamentals',
    category: 'Programming',
    price: 0,
    instructorIndex: 0,
    description:
      'Learn the core ideas of React by building small interfaces with components, props and state.',
    lessons: [
      { title: 'Getting started with React', url: 'https://react.dev/learn' },
      {
        title: 'Thinking in React',
        url: 'https://react.dev/learn/thinking-in-react',
      },
      {
        title: 'JavaScript basics on MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      },
    ],
  },
  {
    title: 'Advanced Node and Express APIs',
    category: 'Programming',
    price: 49,
    instructorIndex: 1,
    description:
      'Build production ready APIs with Node.js, Express and MongoDB, including authentication and validation.',
    lessons: [
      { title: 'Node.js introduction', url: 'https://nodejs.org/en/learn' },
      {
        title: 'Express routing guide',
        url: 'https://expressjs.com/en/guide/routing.html',
      },
      {
        title: 'Express and Node tutorial',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs',
      },
    ],
  },
  {
    title: 'UI Design Foundations',
    category: 'Design',
    price: 39,
    instructorIndex: 0,
    description:
      'A practical introduction to layout, colour and typography for clean, usable interfaces.',
    lessons: [
      {
        title: 'Ten usability heuristics',
        url: 'https://www.nngroup.com/articles/ten-usability-heuristics/',
      },
      {
        title: 'CSS layout on MDN',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS',
      },
      {
        title: 'Typography knowledge',
        url: 'https://fonts.google.com/knowledge',
      },
    ],
  },
  {
    title: 'Digital Marketing Essentials',
    category: 'Marketing',
    price: 0,
    instructorIndex: 1,
    description:
      'Understand campaigns, email lists and analytics so you can market a product with confidence.',
    lessons: [
      {
        title: 'Email marketing basics',
        url: 'https://mailchimp.com/resources/email-marketing-basics/',
      },
      {
        title: 'How to write a marketing plan',
        url: 'https://blog.hubspot.com/marketing/marketing-plan-template-generator',
      },
      {
        title: 'Google Analytics for beginners',
        url: 'https://support.google.com/analytics/answer/1008015',
      },
    ],
  },
  {
    title: 'Business Analytics with Excel',
    category: 'Business',
    price: 29,
    instructorIndex: 0,
    description:
      'Use spreadsheets and dashboards to answer real business questions with clear numbers.',
    lessons: [
      {
        title: 'Excel video training',
        url: 'https://support.microsoft.com/en-us/office/excel-video-training-9bc05390-e94c-46af-a5b3-d7c22f6990bb',
      },
      {
        title: 'Tableau free training',
        url: 'https://www.tableau.com/learn/training',
      },
      {
        title: 'What is business analytics',
        url: 'https://www.coursera.org/articles/business-analytics',
      },
    ],
  },
  {
    title: 'Python for Data Analysis',
    category: 'Data',
    price: 59,
    instructorIndex: 1,
    description:
      'Analyse real datasets with Python, pandas and NumPy, then visualise the results.',
    lessons: [
      {
        title: 'Pandas in ten minutes',
        url: 'https://pandas.pydata.org/docs/user_guide/10min.html',
      },
      {
        title: 'NumPy for absolute beginners',
        url: 'https://numpy.org/doc/stable/user/absolute_beginners.html',
      },
      {
        title: 'Matplotlib tutorials',
        url: 'https://matplotlib.org/stable/tutorials/index.html',
      },
    ],
  },
  {
    title: 'Spanish for Beginners',
    category: 'Language',
    price: 19,
    instructorIndex: 0,
    description:
      'Speak and understand everyday Spanish with short lessons and practical exercises.',
    lessons: [
      { title: 'Duolingo Spanish', url: 'https://www.duolingo.com/' },
      {
        title: 'SpanishDict grammar guide',
        url: 'https://www.spanishdict.com/guide',
      },
      {
        title: 'BBC Spanish lessons',
        url: 'https://www.bbc.co.uk/languages/spanish/',
      },
    ],
  },
  {
    title: 'Public Speaking Confidence',
    category: 'Other',
    price: 25,
    instructorIndex: 1,
    description:
      'Practise structure, delivery and confidence for presentations at university and work.',
    lessons: [
      {
        title: 'TED presentation playlist',
        url: 'https://www.ted.com/playlists/574/how_to_make_a_great_presentation',
      },
      {
        title: 'Toastmasters public speaking tips',
        url: 'https://www.toastmasters.org/resources/public-speaking-tips',
      },
      {
        title: 'Presentation skills',
        url: 'https://www.mindtools.com/comm-skills/presentation-skills',
      },
    ],
  },
];

// student and course are indexes into the arrays above. completed is how many
// of the three lessons the student has finished.
const enrollmentData = [
  { student: 0, course: 0, completed: 3 },
  { student: 0, course: 2, completed: 1 },
  { student: 0, course: 6, completed: 0 },
  { student: 1, course: 1, completed: 2 },
  { student: 1, course: 5, completed: 1 },
  { student: 1, course: 0, completed: 0 },
  { student: 2, course: 3, completed: 3 },
  { student: 2, course: 4, completed: 0 },
  { student: 3, course: 7, completed: 2 },
  { student: 3, course: 0, completed: 1 },
];

async function seed() {
  const required = ['MONGO_URI', 'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD'];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    console.error(`Missing required environment variable(s): ${missing.join(', ')}`);
    console.error('Set them in the process environment before running the seed with --env-only.');
    process.exit(1);
  }

  await connectDB();

  // Start from a clean database so the demo data is always the same.
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Lesson.deleteMany({}),
    Enrollment.deleteMany({}),
    AuditLog.deleteMany({}),
    ...collections.map(model => model.deleteMany({})),
  ]);

  const admin = await User.create({
    name: 'LearnHub Admin',
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    role: 'admin',
  });

  const instructors = [];

  for (const data of instructorData) {
    instructors.push(
      await User.create({ ...data, password: DEMO_PASSWORD, role: 'instructor' })
    );
  }

  const students = [];

  for (const data of studentData) {
    students.push(await User.create({ ...data, password: DEMO_PASSWORD, role: 'student' }));
  }

  const courses = [];
  const lessonsByCourse = [];
  const now = new Date();
  const levels = ['Basic', 'Advanced', 'Basic', 'Basic', 'Intermediate', 'Intermediate', 'Basic', 'Intermediate'];

  for (const data of courseData) {
    const course = await Course.create({
      title: data.title,
      description: data.description,
      category: data.category,
      price: data.price,
      level: levels[courses.length],
      durationHours: 2 + courses.length / 2,
      originalPrice: data.price ? data.price + 20 : 0,
      instructor: instructors[data.instructorIndex]._id,
    });

    const lessons = await Lesson.insertMany(
      data.lessons.map((lesson, index) => ({
        course: course._id,
        title: lesson.title,
        type: 'link',
        contentUrl: lesson.url,
        order: index + 1,
      }))
    );

    courses.push(course);
    lessonsByCourse.push(lessons);
  }

  const enrollmentDocs = enrollmentData.map((data, index) => {
    const courseLessons = lessonsByCourse[data.course];

    return {
      student: students[data.student]._id,
      course: courses[data.course]._id,
      completedLessons: courseLessons
        .slice(0, data.completed)
        .map((lesson) => lesson._id),
      progress: Math.round((data.completed / courseLessons.length) * 100),
      totalSeconds: data.completed ? 1800 + 600 * data.completed : 0,
      sessionCount: data.completed ? Math.max(1, data.completed - 1) : 0,
      lastAccessedAt: data.completed ? new Date(now.getTime() - index * 3600000) : undefined,
      createdAt: new Date(now.getTime() - index * 86400000),
    };
  });

  await Enrollment.insertMany(enrollmentDocs);
  await seedDashboard({ instructors, students, courses, enrollments: enrollmentDocs, now });

  console.log('');
  console.log('Demo accounts:');
  console.table([
    {
      role: 'admin',
      name: admin.name,
      email: admin.email,
      password: '(configured privately)',
    },
    ...instructors.map((user) => ({
      role: user.role,
      name: user.name,
      email: user.email,
      password: DEMO_PASSWORD,
    })),
    ...students.map((user) => ({
      role: user.role,
      name: user.name,
      email: user.email,
      password: DEMO_PASSWORD,
    })),
  ]);

  console.log(
    `Seeded ${courses.length} courses, ${enrollmentDocs.length} enrollments, ` +
      `${instructors.length} instructors and ${students.length} students.`
  );

  await mongoose.disconnect();
  console.log('Seed complete.');
}

seed().catch(async (error) => {
  console.error(`Seed failed: ${error.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
