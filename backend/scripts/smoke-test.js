// Why: this script checks the real API over HTTP, the same way the frontend calls it.
// It uses Node's built-in fetch, so no test framework or extra dependency is needed.
if (!process.argv.includes('--env-only')) require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env'),
  quiet: true,
});

const BASE_URL = process.env.SMOKE_BASE_URL || 'http://localhost:5000/api';
const DASHBOARD_BASE_URL = process.env.SMOKE_DASHBOARD_BASE_URL || 'http://localhost:5001/api';
const dashboardSmoke = require('./dashboard-smoke');
const ORIGIN = new URL(BASE_URL).origin;
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || '';
const ADMIN_PASSWORD =
  process.env.SMOKE_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || '';
const RUN_ID = Date.now();

const results = [];
const context = {};

// Why: every check stores one row so the final table shows PASS or FAIL at a glance.
function record(name, passed, detail = '') {
  results.push({
    check: name,
    result: passed ? 'PASS' : 'FAIL',
    detail: String(detail).slice(0, 90),
  });

  if (!passed) {
    process.exitCode = 1;
  }
}

async function test(name, fn) {
  try {
    const detail = await fn();
    record(name, true, detail || '');
  } catch (error) {
    record(name, false, error.message);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertStatus(response, expected, label) {
  assert(
    response.status === expected,
    `${label}: expected ${expected}, got ${response.status} ${JSON.stringify(response.body)}`
  );
}

function requireContext(key) {
  assert(context[key], `Missing ${key}; an earlier check failed.`);
  return context[key];
}

// Why: these two helpers catch the leaks the security rules care about most.
function assertNoPassword(body, label) {
  const text = JSON.stringify(body);
  assert(!/\$2[aby]\$\d{2}\$/.test(text), `${label}: response contains a bcrypt hash`);
  assert(!/"password"\s*:/.test(text), `${label}: response contains a password field`);
}

function assertNoStoredFileName(body, label) {
  const text = JSON.stringify(body);
  assert(!/"filePath"\s*:/.test(text), `${label}: response contains filePath`);
  assert(!/"originalName"\s*:/.test(text), `${label}: response contains originalName`);
}

async function api(method, path, options = {}, baseUrl = BASE_URL) {
  const url = path.startsWith('http') ? path : baseUrl + path;
  const headers = { ...(options.headers || {}) };
  let body;

  if (options.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.json);
  } else if (options.form !== undefined) {
    body = options.form;
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(url, { method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(10000) });

  if (options.binary) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return { status: response.status, body: buffer, headers: response.headers };
  }

  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  let parsed = text;

  if (contentType.includes('application/json') && text) {
    parsed = JSON.parse(text);
  }

  return { status: response.status, body: parsed, headers: response.headers };
}

async function run() {
  assert(ADMIN_EMAIL && ADMIN_PASSWORD, 'Provide the smoke admin credentials in the process environment.');
  assert(new URL(BASE_URL).origin !== new URL(DASHBOARD_BASE_URL).origin,
    'Use a second backend instance for the dashboard smoke checks.');
  const dashboardHealth = await api('GET', '/health', {}, DASHBOARD_BASE_URL);
  assertStatus(dashboardHealth, 200, 'dashboard smoke backend health');
  const primaryHealth = await api('GET', '/health');
  assertStatus(primaryHealth, 200, 'primary smoke backend health');

  const unique = `smoke.${RUN_ID}`;
  const studentEmail = `${unique}.student@learnhub.test`;
  const instructorEmail = `${unique}.instructor@learnhub.test`;
  const secondInstructorEmail = `${unique}.instructor2@learnhub.test`;
  const password = 'Password123';

  context.studentEmail = studentEmail;
  context.password = password;

  // ------------------------------- PUBLIC ---------------------------------
  await test('GET /api/health', async () => {
    const res = primaryHealth;
    assertStatus(res, 200, 'health');
    assert(res.body.status === 'ok', 'health: status is not ok');
    return 'status ok';
  });

  await test('GET /api/categories', async () => {
    const res = await api('GET', '/categories');
    assertStatus(res, 200, 'categories');
    assert(Array.isArray(res.body), 'categories: response is not an array');
    assert(res.body.includes('Programming'), 'categories: Programming missing');
    return `${res.body.length} categories`;
  });

  await test('GET /api/stats', async () => {
    const res = await api('GET', '/stats');
    assertStatus(res, 200, 'stats');
    assert(typeof res.body.courses === 'number', 'stats: courses is not a number');
    assert(typeof res.body.learners === 'number', 'stats: learners is not a number');
    assert(typeof res.body.instructors === 'number', 'stats: instructors is not a number');
    return `courses ${res.body.courses}, learners ${res.body.learners}, instructors ${res.body.instructors}`;
  });

  // -------------------------------- AUTH ----------------------------------
  await test('POST /api/register student', async () => {
    const res = await api('POST', '/register', {
      json: { name: 'Smoke Student', email: studentEmail, password, role: 'student' },
    });
    assertStatus(res, 201, 'register student');
    assert(res.body.token, 'register student: token missing');
    assert(res.body.user.role === 'student', 'register student: wrong role');
    assertNoPassword(res.body, 'register student');
    context.studentToken = res.body.token;
    context.studentId = res.body.user.id;
    return res.body.user.email;
  });

  await test('POST /api/register instructor', async () => {
    const res = await api('POST', '/register', {
      json: {
        name: 'Smoke Instructor',
        email: instructorEmail,
        password,
        role: 'instructor',
      },
    });
    assertStatus(res, 201, 'register instructor');
    assert(res.body.user.role === 'instructor', 'register instructor: wrong role');
    assertNoPassword(res.body, 'register instructor');
    context.instructorToken = res.body.token;
    context.instructorId = res.body.user.id;
    return res.body.user.email;
  });

  await test('POST /api/register second instructor', async () => {
    const res = await api('POST', '/register', {
      json: {
        name: 'Smoke Instructor Two',
        email: secondInstructorEmail,
        password,
        role: 'instructor',
      },
    });
    assertStatus(res, 201, 'register second instructor');
    assert(res.body.user.role === 'instructor', 'register second instructor: wrong role');
    assertNoPassword(res.body, 'register second instructor');
    context.secondInstructorToken = res.body.token;
    context.secondInstructorId = res.body.user.id;
    return res.body.user.email;
  });

  await test('POST /api/register duplicate email', async () => {
    const res = await api('POST', '/register', {
      json: { name: 'Duplicate', email: studentEmail, password, role: 'student' },
    });
    assertStatus(res, 409, 'duplicate email');
    return res.body.message;
  });

  await test('POST /api/register admin role rejected', async () => {
    const res = await api('POST', '/register', {
      json: {
        name: 'Bad Admin',
        email: `${unique}.admin@learnhub.test`,
        password,
        role: 'admin',
      },
    });
    assertStatus(res, 400, 'admin role');
    assert(res.body.errors && res.body.errors.role, 'admin role: role error missing');
    return res.body.errors.role;
  });

  await test('POST /api/register weak password rejected', async () => {
    const res = await api('POST', '/register', {
      json: {
        name: 'Weak Password',
        email: `${unique}.weak@learnhub.test`,
        password: 'abc',
        role: 'student',
      },
    });
    assertStatus(res, 400, 'weak password');
    assert(res.body.errors && res.body.errors.password, 'weak password: password error missing');
    return res.body.errors.password;
  });

  await test('POST /api/login correct password', async () => {
    const res = await api('POST', '/login', { json: { email: studentEmail, password } });
    assertStatus(res, 200, 'login');
    assert(res.body.token, 'login: token missing');
    assert(res.body.user.email === studentEmail, 'login: wrong user');
    assertNoPassword(res.body, 'login');
    context.studentToken = res.body.token;
    return res.body.user.email;
  });

  await test('POST /api/login wrong password', async () => {
    const res = await api('POST', '/login', {
      json: { email: studentEmail, password: 'WrongPassword1' },
    });
    assertStatus(res, 401, 'login wrong');
    assert(
      res.body.message === 'Invalid email or password',
      'login wrong: generic message changed'
    );
    return res.body.message;
  });

  await test('POST /api/login NoSQL injection rejected', async () => {
    const res = await api('POST', '/login', {
      json: { email: { $gt: '' }, password: 'x' },
    });
    assertStatus(res, 400, 'NoSQL injection');
    return res.body.message;
  });

  await test('GET /api/me without token', async () => {
    const res = await api('GET', '/me');
    assertStatus(res, 401, 'me without token');
    return res.body.message;
  });

  await test('GET /api/me with token', async () => {
    const res = await api('GET', '/me', { token: requireContext('studentToken') });
    assertStatus(res, 200, 'me');
    assert(res.body.user.id === requireContext('studentId'), 'me: wrong user id');
    assertNoPassword(res.body, 'me');
    return res.body.user.email;
  });

  await test('POST /api/login admin', async () => {
    assert(
      ADMIN_EMAIL && ADMIN_PASSWORD,
      'Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in backend/.env'
    );
    const res = await api('POST', '/login', {
      json: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    assertStatus(res, 200, 'admin login');
    assert(res.body.user.role === 'admin', 'admin login: wrong role');
    assertNoPassword(res.body, 'admin login');
    context.adminToken = res.body.token;
    context.adminId = res.body.user.id;
    return res.body.user.email;
  });

  // ------------------------------- COURSES --------------------------------
  await test('GET /api/courses list', async () => {
    const res = await api('GET', '/courses');
    assertStatus(res, 200, 'courses list');
    assert(Array.isArray(res.body.courses), 'courses list: courses is not an array');
    assert(typeof res.body.total === 'number', 'courses list: total missing');
    return `${res.body.courses.length} of ${res.body.total}`;
  });

  await test('GET /api/courses filter and sort', async () => {
    const res = await api('GET', '/courses?category=Programming&sort=price_asc&page=1&limit=5');
    assertStatus(res, 200, 'courses filter');
    assert(
      res.body.courses.every((course) => course.category === 'Programming'),
      'courses filter: wrong category returned'
    );
    return `${res.body.courses.length} Programming courses`;
  });

  await test('GET /api/courses invalid category', async () => {
    const res = await api('GET', '/courses?category=NotARealCategory');
    assertStatus(res, 400, 'invalid category');
    assert(res.body.errors && res.body.errors.category, 'invalid category: error missing');
    return res.body.errors.category;
  });

  await test('GET /api/courses/:id invalid id', async () => {
    const res = await api('GET', '/courses/not-an-id');
    assertStatus(res, 400, 'invalid course id');
    return res.body.message;
  });

  await test('POST /api/courses as instructor', async () => {
    const res = await api('POST', '/courses', {
      token: requireContext('instructorToken'),
      json: {
        title: 'Smoke Test Course',
        description: 'A course created by the smoke test to check the main flows.',
        category: 'Programming',
        price: 25,
        thumbnail: 'https://example.com/smoke.png',
      },
    });
    assertStatus(res, 201, 'create course');
    assert(res.body.course, 'create course: course missing');
    assert(
      String(res.body.course.instructor._id) === requireContext('instructorId'),
      'create course: wrong instructor'
    );
    context.courseId = res.body.course._id;
    return res.body.course.title;
  });

  await test('POST /api/courses as student forbidden', async () => {
    const res = await api('POST', '/courses', {
      token: requireContext('studentToken'),
      json: {
        title: 'Student Course',
        description: 'A student should never be allowed to create a course.',
        category: 'Programming',
        price: 0,
      },
    });
    assertStatus(res, 403, 'student create course');
    return res.body.message;
  });

  await test('PUT /api/courses/:id own course', async () => {
    const res = await api('PUT', `/courses/${requireContext('courseId')}`, {
      token: requireContext('instructorToken'),
      json: { title: 'Smoke Test Course Updated' },
    });
    assertStatus(res, 200, 'update own course');
    assert(
      res.body.course.title === 'Smoke Test Course Updated',
      'update own course: title not changed'
    );
    return res.body.course.title;
  });

  await test('POST /api/courses as second instructor', async () => {
    const res = await api('POST', '/courses', {
      token: requireContext('secondInstructorToken'),
      json: {
        title: 'Second Instructor Course',
        description: 'Used to check that one instructor cannot edit another instructor course.',
        category: 'Design',
        price: 0,
      },
    });
    assertStatus(res, 201, 'create second course');
    context.secondCourseId = res.body.course._id;
    return res.body.course.title;
  });

  await test('PUT /api/courses/:id another instructor forbidden', async () => {
    const res = await api('PUT', `/courses/${requireContext('courseId')}`, {
      token: requireContext('secondInstructorToken'),
      json: { title: 'Hijacked' },
    });
    assertStatus(res, 403, 'update another instructor course');
    return res.body.message;
  });

  await test('GET /api/courses/:id', async () => {
    const res = await api('GET', `/courses/${requireContext('courseId')}`);
    assertStatus(res, 200, 'get course');
    assert(res.body.course._id === requireContext('courseId'), 'get course: wrong id');
    return res.body.course.title;
  });

  await test('GET /api/courses/mine as instructor', async () => {
    const res = await api('GET', '/courses/mine', { token: requireContext('instructorToken') });
    assertStatus(res, 200, 'my courses');
    assert(
      res.body.courses.some((course) => course._id === requireContext('courseId')),
      'my courses: created course missing'
    );
    return `${res.body.courses.length} courses`;
  });

  await test('GET /api/courses/mine as student forbidden', async () => {
    const res = await api('GET', '/courses/mine', { token: requireContext('studentToken') });
    assertStatus(res, 403, 'student my courses');
    return res.body.message;
  });

  await test('DELETE /api/courses/:id another instructor forbidden', async () => {
    const res = await api('DELETE', `/courses/${requireContext('courseId')}`, {
      token: requireContext('secondInstructorToken'),
    });
    assertStatus(res, 403, 'delete another instructor course');
    return res.body.message;
  });

  await test('DELETE /api/courses/:id own course', async () => {
    const created = await api('POST', '/courses', {
      token: requireContext('instructorToken'),
      json: {
        title: 'Disposable Course',
        description: 'This course exists only to check that an owner can delete a course.',
        category: 'Other',
        price: 0,
      },
    });
    assertStatus(created, 201, 'create disposable course');

    const deleted = await api('DELETE', `/courses/${created.body.course._id}`, {
      token: requireContext('instructorToken'),
    });
    assertStatus(deleted, 200, 'delete own course');
    return deleted.body.message;
  });

  await test('DELETE /api/courses/:id invalid id', async () => {
    const res = await api('DELETE', '/courses/not-an-id', {
      token: requireContext('instructorToken'),
    });
    assertStatus(res, 400, 'delete invalid course id');
    return res.body.message;
  });

  // ------------------------------- LESSONS --------------------------------
  await test('POST /api/courses/:courseId/lessons link', async () => {
    const res = await api('POST', `/courses/${requireContext('courseId')}/lessons`, {
      token: requireContext('instructorToken'),
      json: { title: 'Smoke Link Lesson', contentUrl: 'https://react.dev/learn' },
    });
    assertStatus(res, 201, 'add link lesson');
    assert(res.body.type === 'link', 'add link lesson: wrong type');
    context.linkLessonId = res.body._id;
    return res.body.title;
  });

  await test('POST /api/courses/:courseId/lessons as student forbidden', async () => {
    const res = await api('POST', `/courses/${requireContext('courseId')}/lessons`, {
      token: requireContext('studentToken'),
      json: { title: 'Student Lesson', contentUrl: 'https://example.com' },
    });
    assertStatus(res, 403, 'student add lesson');
    return res.body.message;
  });

  await test('POST /api/courses/:courseId/lessons as other instructor forbidden', async () => {
    const res = await api('POST', `/courses/${requireContext('courseId')}/lessons`, {
      token: requireContext('secondInstructorToken'),
      json: { title: 'Other Lesson', contentUrl: 'https://example.com' },
    });
    assertStatus(res, 403, 'other instructor add lesson');
    return res.body.message;
  });

  await test('POST /api/courses/:courseId/lessons upload PDF', async () => {
    const pdf = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'
    );
    const form = new FormData();
    form.append('title', 'Smoke PDF Lesson');
    form.append('file', new Blob([pdf], { type: 'application/pdf' }), 'smoke.pdf');

    const res = await api('POST', `/courses/${requireContext('courseId')}/lessons`, {
      token: requireContext('instructorToken'),
      form,
    });
    assertStatus(res, 201, 'upload PDF');
    assert(res.body.type === 'pdf', 'upload PDF: wrong type');
    context.pdfLessonId = res.body._id;
    return res.body.title;
  });

  await test('POST /api/courses/:courseId/lessons reject .exe', async () => {
    const form = new FormData();
    form.append('title', 'Bad File Lesson');
    form.append(
      'file',
      new Blob([Buffer.from('MZ')], { type: 'application/octet-stream' }),
      'bad.exe'
    );

    const res = await api('POST', `/courses/${requireContext('courseId')}/lessons`, {
      token: requireContext('instructorToken'),
      form,
    });
    assertStatus(res, 400, 'reject exe');
    return res.body.message;
  });

  await test('GET /api/courses/:courseId/lessons public', async () => {
    const res = await api('GET', `/courses/${requireContext('courseId')}/lessons`);
    assertStatus(res, 200, 'public lessons');
    assert(Array.isArray(res.body), 'public lessons: not an array');
    assert(res.body.length >= 2, 'public lessons: expected at least 2 lessons');
    assertNoStoredFileName(res.body, 'public lessons');
    return `${res.body.length} lessons`;
  });

  await test('GET /api/lessons/:id/access not enrolled', async () => {
    const res = await api('GET', `/lessons/${requireContext('linkLessonId')}/access`, {
      token: requireContext('studentToken'),
    });
    assertStatus(res, 403, 'lesson access not enrolled');
    return res.body.message;
  });

  await test('GET /api/lessons/:id/access owner instructor', async () => {
    const res = await api('GET', `/lessons/${requireContext('linkLessonId')}/access`, {
      token: requireContext('instructorToken'),
    });
    assertStatus(res, 200, 'lesson access owner');
    assert(
      res.body.lesson.contentUrl === 'https://react.dev/learn',
      'lesson access owner: wrong URL'
    );
    return res.body.lesson.title;
  });

  await test('GET /api/files/:token invalid', async () => {
    const res = await api('GET', '/files/not-a-real-token');
    assertStatus(res, 401, 'invalid file token');
    return res.body.message;
  });

  // ----------------------------- ENROLLMENT -------------------------------
  await test('POST /api/enroll', async () => {
    const res = await api('POST', '/enroll', {
      token: requireContext('studentToken'),
      json: { courseId: requireContext('courseId') },
    });
    assertStatus(res, 201, 'enroll');
    assert(res.body.enrollment, 'enroll: enrollment missing');
    context.enrollmentId = res.body.enrollment._id;
    return res.body.enrollment._id;
  });

  await test('POST /api/enroll duplicate', async () => {
    const res = await api('POST', '/enroll', {
      token: requireContext('studentToken'),
      json: { courseId: requireContext('courseId') },
    });
    assertStatus(res, 409, 'duplicate enroll');
    assert(
      res.body.message === 'You are already enrolled in this course.',
      'duplicate enroll: wrong message'
    );
    return res.body.message;
  });

  await test('GET /api/my-courses', async () => {
    const res = await api('GET', '/my-courses', { token: requireContext('studentToken') });
    assertStatus(res, 200, 'my courses');
    const item = res.body.courses.find(
      (course) => course.course._id === requireContext('courseId')
    );
    assert(item, 'my courses: enrolled course missing');
    assert(
      item.course.lessonCount === 2,
      `my courses: expected 2 lessons, got ${item.course.lessonCount}`
    );
    assertNoPassword(res.body, 'my courses');
    return `${res.body.courses.length} enrolled courses`;
  });

  await test('GET /api/my-courses/:courseId', async () => {
    const res = await api('GET', `/my-courses/${requireContext('courseId')}`, {
      token: requireContext('studentToken'),
    });
    assertStatus(res, 200, 'my course detail');
    assert(res.body.lessons.length === 2, 'my course detail: expected 2 lessons');
    assert(
      res.body.lessons.every((lesson) => lesson.completed === false),
      'my course detail: lessons should start incomplete'
    );
    assertNoStoredFileName(res.body, 'my course detail');
    return `${res.body.lessons.length} lessons, progress ${res.body.progress}`;
  });

  await test('GET /api/lessons/:id/access enrolled student', async () => {
    const res = await api('GET', `/lessons/${requireContext('linkLessonId')}/access`, {
      token: requireContext('studentToken'),
    });
    assertStatus(res, 200, 'lesson access enrolled');
    assert(
      res.body.lesson.contentUrl === 'https://react.dev/learn',
      'lesson access enrolled: wrong URL'
    );
    return res.body.lesson.title;
  });

  await test('GET /api/lessons/:id/access PDF enrolled student', async () => {
    const res = await api('GET', `/lessons/${requireContext('pdfLessonId')}/access`, {
      token: requireContext('studentToken'),
    });
    assertStatus(res, 200, 'PDF access enrolled');
    assert(res.body.fileUrl, 'PDF access enrolled: fileUrl missing');
    context.fileUrl = res.body.fileUrl;
    return res.body.fileUrl;
  });

  await test('GET /api/files/:token returns the file', async () => {
    const fileUrl = requireContext('fileUrl');
    const res = await api('GET', fileUrl.startsWith('http') ? fileUrl : ORIGIN + fileUrl, {
      binary: true,
    });
    assertStatus(res, 200, 'download file');
    assert(
      res.headers.get('content-type').includes('application/pdf'),
      'download file: wrong content type'
    );
    assert(res.body.slice(0, 4).toString() === '%PDF', 'download file: not a PDF');
    const disposition = res.headers.get('content-disposition') || '';
    assert(disposition.startsWith('inline'), 'download file: expected inline disposition');
    assert(!disposition.includes('.pdf'), 'download file: stored file name leaked');
    return `${res.body.length} bytes`;
  });

  await test('PATCH progress complete link lesson', async () => {
    const res = await api(
      'PATCH',
      `/my-courses/${requireContext('courseId')}/lessons/${requireContext('linkLessonId')}`,
      { token: requireContext('studentToken'), json: { completed: true } }
    );
    assertStatus(res, 200, 'complete link lesson');
    assert(
      res.body.progress === 50,
      `complete link lesson: expected 50, got ${res.body.progress}`
    );
    return `progress ${res.body.progress}`;
  });

  await test('PATCH progress complete PDF lesson', async () => {
    const res = await api(
      'PATCH',
      `/my-courses/${requireContext('courseId')}/lessons/${requireContext('pdfLessonId')}`,
      { token: requireContext('studentToken'), json: { completed: true } }
    );
    assertStatus(res, 200, 'complete PDF lesson');
    assert(
      res.body.progress === 100,
      `complete PDF lesson: expected 100, got ${res.body.progress}`
    );
    return `progress ${res.body.progress}`;
  });

  await test('PATCH progress uncomplete link lesson', async () => {
    const res = await api(
      'PATCH',
      `/my-courses/${requireContext('courseId')}/lessons/${requireContext('linkLessonId')}`,
      { token: requireContext('studentToken'), json: { completed: false } }
    );
    assertStatus(res, 200, 'uncomplete link lesson');
    assert(
      res.body.progress === 50,
      `uncomplete link lesson: expected 50, got ${res.body.progress}`
    );
    return `progress ${res.body.progress}`;
  });

  await test('PATCH progress rejects string boolean', async () => {
    const res = await api(
      'PATCH',
      `/my-courses/${requireContext('courseId')}/lessons/${requireContext('linkLessonId')}`,
      { token: requireContext('studentToken'), json: { completed: 'true' } }
    );
    assertStatus(res, 400, 'string boolean');
    assert(res.body.errors && res.body.errors.completed, 'string boolean: error missing');
    return res.body.errors.completed;
  });

  await test('PATCH progress lesson from another course', async () => {
    const created = await api('POST', `/courses/${requireContext('secondCourseId')}/lessons`, {
      token: requireContext('secondInstructorToken'),
      json: { title: 'Other Course Lesson', contentUrl: 'https://example.com/other' },
    });
    assertStatus(created, 201, 'create other course lesson');
    context.secondLessonId = created.body._id;

    const res = await api(
      'PATCH',
      `/my-courses/${requireContext('courseId')}/lessons/${context.secondLessonId}`,
      { token: requireContext('studentToken'), json: { completed: true } }
    );
    assertStatus(res, 404, 'lesson from another course');
    assert(
      res.body.message === 'Lesson not found',
      'lesson from another course: wrong message'
    );
    return res.body.message;
  });

  await test('POST /api/enroll as instructor forbidden', async () => {
    const res = await api('POST', '/enroll', {
      token: requireContext('instructorToken'),
      json: { courseId: requireContext('courseId') },
    });
    assertStatus(res, 403, 'instructor enroll');
    return res.body.message;
  });

  await test('GET /api/my-courses as instructor forbidden', async () => {
    const res = await api('GET', '/my-courses', { token: requireContext('instructorToken') });
    assertStatus(res, 403, 'instructor my courses');
    return res.body.message;
  });

  await test('GET /api/my-courses/:courseId as instructor forbidden', async () => {
    const res = await api('GET', `/my-courses/${requireContext('courseId')}`, {
      token: requireContext('instructorToken'),
    });
    assertStatus(res, 403, 'instructor my course detail');
    return res.body.message;
  });

  await test('PATCH progress as instructor forbidden', async () => {
    const res = await api(
      'PATCH',
      `/my-courses/${requireContext('courseId')}/lessons/${requireContext('linkLessonId')}`,
      { token: requireContext('instructorToken'), json: { completed: true } }
    );
    assertStatus(res, 403, 'instructor patch progress');
    return res.body.message;
  });

  await test('GET /api/my-courses/:courseId not enrolled', async () => {
    const res = await api('GET', `/my-courses/${requireContext('secondCourseId')}`, {
      token: requireContext('studentToken'),
    });
    assertStatus(res, 404, 'not enrolled detail');
    return res.body.message;
  });

  await test('DELETE /api/lessons/:id as student forbidden', async () => {
    const res = await api('DELETE', `/lessons/${requireContext('linkLessonId')}`, {
      token: requireContext('studentToken'),
    });
    assertStatus(res, 403, 'student delete lesson');
    return res.body.message;
  });

  await test('DELETE /api/lessons/:id as other instructor forbidden', async () => {
    const res = await api('DELETE', `/lessons/${requireContext('secondLessonId')}`, {
      token: requireContext('instructorToken'),
    });
    assertStatus(res, 403, 'other instructor delete lesson');
    return res.body.message;
  });

  await test('DELETE /api/lessons/:id as owner', async () => {
    const res = await api('DELETE', `/lessons/${requireContext('secondLessonId')}`, {
      token: requireContext('secondInstructorToken'),
    });
    assertStatus(res, 200, 'owner delete lesson');
    return res.body.message;
  });

  // -------------------------------- ADMIN ---------------------------------
  await test('GET /api/admin/users as student forbidden', async () => {
    const res = await api('GET', '/admin/users', { token: requireContext('studentToken') });
    assertStatus(res, 403, 'admin users student');
    return res.body.message;
  });

  await test('GET /api/admin/users as instructor forbidden', async () => {
    const res = await api('GET', '/admin/users', { token: requireContext('instructorToken') });
    assertStatus(res, 403, 'admin users instructor');
    return res.body.message;
  });

  await test('GET /api/admin/users as admin', async () => {
    const res = await api('GET', '/admin/users?page=1&limit=10', {
      token: requireContext('adminToken'),
    });
    assertStatus(res, 200, 'admin users');
    assert(Array.isArray(res.body.users), 'admin users: users is not an array');
    assert(typeof res.body.total === 'number', 'admin users: total missing');
    assertNoPassword(res.body, 'admin users');
    return `${res.body.users.length} of ${res.body.total} users`;
  });

  await test('GET /api/admin/users search', async () => {
    const res = await api(
      'GET',
      `/admin/users?search=${encodeURIComponent(studentEmail)}&page=1&limit=5`,
      { token: requireContext('adminToken') }
    );
    assertStatus(res, 200, 'admin users search');
    assert(
      res.body.users.some((user) => user.email === studentEmail),
      'admin users search: student missing'
    );
    return `${res.body.users.length} match`;
  });

  await test('GET /api/admin/users bad limit', async () => {
    const res = await api('GET', '/admin/users?limit=100', {
      token: requireContext('adminToken'),
    });
    assertStatus(res, 400, 'admin users bad limit');
    assert(res.body.errors && res.body.errors.limit, 'admin users bad limit: error missing');
    return res.body.errors.limit;
  });

  await test('PATCH /api/admin/users/:id/role own role forbidden', async () => {
    const res = await api('PATCH', `/admin/users/${requireContext('adminId')}/role`, {
      token: requireContext('adminToken'),
      json: { role: 'student' },
    });
    assertStatus(res, 400, 'admin own role');
    assert(
      res.body.message === 'You cannot change your own role.',
      'admin own role: wrong message'
    );
    return res.body.message;
  });

  await test('PATCH /api/admin/users/:id/role invalid role', async () => {
    const res = await api('PATCH', `/admin/users/${requireContext('studentId')}/role`, {
      token: requireContext('adminToken'),
      json: { role: 'superuser' },
    });
    assertStatus(res, 400, 'admin invalid role');
    assert(res.body.errors && res.body.errors.role, 'admin invalid role: error missing');
    return res.body.errors.role;
  });

  await test('PATCH /api/admin/users/:id/role missing user', async () => {
    const res = await api('PATCH', '/admin/users/000000000000000000000000/role', {
      token: requireContext('adminToken'),
      json: { role: 'student' },
    });
    assertStatus(res, 404, 'admin missing user');
    return res.body.message;
  });

  await test('PATCH /api/admin/users/:id/role change student', async () => {
    const res = await api('PATCH', `/admin/users/${requireContext('studentId')}/role`, {
      token: requireContext('adminToken'),
      json: { role: 'instructor' },
    });
    assertStatus(res, 200, 'admin change role');
    assert(res.body.user.role === 'instructor', 'admin change role: role not changed');
    return res.body.user.role;
  });

  await test('PATCH /api/admin/users/:id/role change back', async () => {
    const res = await api('PATCH', `/admin/users/${requireContext('studentId')}/role`, {
      token: requireContext('adminToken'),
      json: { role: 'student' },
    });
    assertStatus(res, 200, 'admin change role back');
    assert(res.body.user.role === 'student', 'admin change role back: role not restored');
    return res.body.user.role;
  });

  await test('DELETE /api/admin/users/:id self forbidden', async () => {
    const res = await api('DELETE', `/admin/users/${requireContext('adminId')}`, {
      token: requireContext('adminToken'),
    });
    assertStatus(res, 400, 'admin delete self');
    return res.body.message;
  });

  await test('DELETE /api/admin/users/:id instructor with courses', async () => {
    const res = await api('DELETE', `/admin/users/${requireContext('instructorId')}`, {
      token: requireContext('adminToken'),
    });
    assertStatus(res, 400, 'delete instructor with courses');
    assert(
      res.body.message === 'This instructor still has courses. Delete or reassign them first.',
      'delete instructor with courses: wrong message'
    );
    return res.body.message;
  });

  await test('GET /api/admin/analytics as student forbidden', async () => {
    const res = await api('GET', '/admin/analytics', { token: requireContext('studentToken') });
    assertStatus(res, 403, 'analytics student');
    return res.body.message;
  });

  await test('GET /api/admin/analytics as instructor forbidden', async () => {
    const res = await api('GET', '/admin/analytics', {
      token: requireContext('instructorToken'),
    });
    assertStatus(res, 403, 'analytics instructor');
    return res.body.message;
  });

  await test('GET /api/admin/analytics as admin', async () => {
    const res = await api('GET', '/admin/analytics', { token: requireContext('adminToken') });
    assertStatus(res, 200, 'analytics');
    assert(typeof res.body.totals === 'object', 'analytics: totals missing');
    assert(typeof res.body.totals.users === 'number', 'analytics: totals.users missing');
    assert(typeof res.body.totals.courses === 'number', 'analytics: totals.courses missing');
    assert(
      typeof res.body.totals.enrollments === 'number',
      'analytics: totals.enrollments missing'
    );
    assert(typeof res.body.totals.lessons === 'number', 'analytics: totals.lessons missing');
    assert(typeof res.body.usersByRole === 'object', 'analytics: usersByRole missing');
    assert(Array.isArray(res.body.topCourses), 'analytics: topCourses is not an array');
    assert(
      Array.isArray(res.body.enrollmentsLast7Days) &&
        res.body.enrollmentsLast7Days.length === 7,
      'analytics: expected 7 daily entries'
    );
    assert(
      typeof res.body.averageProgress === 'number',
      'analytics: averageProgress is not a number'
    );
    return `users ${res.body.totals.users}, courses ${res.body.totals.courses}, avg ${res.body.averageProgress}`;
  });

  await test('GET /api/admin/audit-logs as student forbidden', async () => {
    const res = await api('GET', '/admin/audit-logs', { token: requireContext('studentToken') });
    assertStatus(res, 403, 'audit logs student');
    return res.body.message;
  });

  await test('GET /api/admin/audit-logs as admin', async () => {
    const res = await api('GET', '/admin/audit-logs', { token: requireContext('adminToken') });
    assertStatus(res, 200, 'audit logs');
    assert(Array.isArray(res.body.logs), 'audit logs: logs is not an array');
    assert(res.body.logs.length > 0, 'audit logs: expected at least one entry');
    assert(
      res.body.logs.some((log) => log.action === 'change_user_role'),
      'audit logs: role change entry missing'
    );
    assertNoPassword(res.body, 'audit logs');
    return `${res.body.logs.length} entries`;
  });

  await dashboardSmoke({
    api: (method, path, options) => api(method, path, options, DASHBOARD_BASE_URL),
    test, assert, assertStatus, context, runId: RUN_ID,
  });

  await test('DELETE /api/admin/users/:id student', async () => {
    const res = await api('DELETE', `/admin/users/${requireContext('studentId')}`, {
      token: requireContext('adminToken'),
    });
    assertStatus(res, 200, 'admin delete student');
    return res.body.message;
  });

  await test('GET /api/my-courses after student deleted', async () => {
    const res = await api('GET', '/my-courses', { token: requireContext('studentToken') });
    assertStatus(res, 401, 'deleted student token');
    return res.body.message;
  });

  await test('DELETE /api/courses/:id main course', async () => {
    const res = await api('DELETE', `/courses/${requireContext('courseId')}`, {
      token: requireContext('instructorToken'),
    });
    assertStatus(res, 200, 'delete main course');
    return res.body.message;
  });

  await test('DELETE /api/courses/:id second course', async () => {
    const res = await api('DELETE', `/courses/${requireContext('secondCourseId')}`, {
      token: requireContext('secondInstructorToken'),
    });
    assertStatus(res, 200, 'delete second course');
    return res.body.message;
  });

  await test('DELETE /api/admin/users/:id instructor A', async () => {
    const res = await api('DELETE', `/admin/users/${requireContext('instructorId')}`, {
      token: requireContext('adminToken'),
    });
    assertStatus(res, 200, 'admin delete instructor A');
    return res.body.message;
  });

  await test('DELETE /api/admin/users/:id instructor B', async () => {
    const res = await api('DELETE', `/admin/users/${requireContext('secondInstructorId')}`, {
      token: requireContext('adminToken'),
    });
    assertStatus(res, 200, 'admin delete instructor B');
    return res.body.message;
  });

  // ------------------------------ RATE LIMIT ------------------------------
  // Why: this check runs last because it uses up the login quota for this IP.
  await test('POST /api/login rate limit returns 429', async () => {
    let lastStatus = 0;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const res = await api('POST', '/login', {
        json: { email: studentEmail, password: 'WrongPassword1' },
      });
      lastStatus = res.status;

      if (res.status === 429) {
        return res.body.message;
      }

      if (res.status !== 401) {
        break;
      }
    }

    throw new Error(`expected 429, last status was ${lastStatus}`);
  });

}

// Why: if a check fails early, the created users and courses should not stay behind.
async function cleanup() {
  const adminToken = context.adminToken;
  const instructorToken = context.instructorToken;
  const secondInstructorToken = context.secondInstructorToken;

  async function safeDelete(path, token) {
    if (!token) {
      return;
    }

    try {
      await api('DELETE', path, { token });
    } catch (error) {
      // Cleanup is best effort; the final table already shows the real failure.
    }
  }

  if (context.courseId) {
    await safeDelete(`/courses/${context.courseId}`, adminToken || instructorToken);
  }

  if (context.secondCourseId) {
    await safeDelete(
      `/courses/${context.secondCourseId}`,
      adminToken || secondInstructorToken
    );
  }

  if (adminToken) {
    const userIds = [
      context.studentId,
      context.instructorId,
      context.secondInstructorId,
    ];

    for (const id of userIds) {
      if (id) {
        await safeDelete(`/admin/users/${id}`, adminToken);
      }
    }
  }
}

run()
  .catch((error) => {
    console.error('');
    console.error(`Could not run the smoke test: ${error.message}`);
    console.error(`Smoke API URLs: ${BASE_URL} and ${DASHBOARD_BASE_URL}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();

    console.log('');
    console.table(results);
    const passed = results.filter((row) => row.result === 'PASS').length;
    const failed = results.length - passed;
    console.log(`${passed} passed, ${failed} failed.`);
  });
