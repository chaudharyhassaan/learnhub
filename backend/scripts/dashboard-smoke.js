// Run dashboard requests against a second local instance so the full smoke suite
// can exercise both sets of routes without changing the application's rate limits.
module.exports = async function dashboardSmoke({ api, test, assert, assertStatus, context, runId }) {
  const { instructorToken: owner, secondInstructorToken: other, studentToken: student,
    adminToken: admin, courseId, secondCourseId, studentId, instructorId } = context;
  let groupId, eventId, pathId, extraCourseId, outside;
  const now = new Date();
  const from = new Date(now.getTime() - 86400000).toISOString();
  const to = new Date(now.getTime() + 86400000).toISOString();
  const event = {
    title: 'Smoke lecture', type: 'lecture', courseId,
    startsAt: now.toISOString(), endsAt: new Date(now.getTime() + 3600000).toISOString(),
  };
  const calendar = '/events?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to);

  function check(method, path, expected, token, json, inspect) {
    return test(method + ' ' + path + ' expects ' + expected, async () => {
      const response = await api(method, path, { token, json });
      assertStatus(response, expected, path);
      if (inspect) inspect(response.body);
    });
  }

  await check('GET', '/notifications', 401);
  await check('GET', '/instructor/overview', 403, student);
  await check('GET', '/instructor/overview', 200, owner, undefined, body =>
    assert(body.courses.some(course => course._id === courseId), 'Owner course missing from overview'));
  await check('GET', '/instructor/overview', 200, admin);
  await check('GET', '/instructor/tracking?courseId=' + courseId, 403, other);
  await check('GET', '/instructor/tracking?courseId=' + courseId, 200, owner, undefined, body =>
    assert(body.enrollmentsByDay.length === 30, 'Expected a 30-day tracking series'));

  await check('POST', '/register', 201, undefined,
    { name: 'Unenrolled Smoke Student', email: 'dashboard-smoke-' + runId + '@example.com', password: 'SmokePass123', role: 'student' },
    body => { outside = body; });
  try {
    await check('POST', '/courses/' + courseId + '/reviews', 403, outside?.token, { rating: 5 });
    await check('POST', '/courses/' + courseId + '/reviews', 200, student, { rating: 5, comment: 'Helpful examples.' });
    await check('GET', '/courses/' + courseId + '/reviews', 200, undefined, undefined, body => {
      assert(body.reviews.some(review => review.rating === 5 && review.firstName), 'Public review missing');
      assert(!JSON.stringify(body).includes(context.studentEmail), 'Public review exposes email');
    });

    const heartbeat = '/my-courses/' + courseId + '/heartbeat';
    await check('PATCH', heartbeat, 404, outside?.token, { seconds: 30 });
    await check('PATCH', heartbeat, 400, student, { seconds: '30' });
    await check('PATCH', heartbeat, 200, student, { seconds: 30 }, body =>
      assert(body.totalSeconds === 30 && body.sessionCount === 1, 'First heartbeat should create a session'));
    await check('PATCH', heartbeat, 200, student, { seconds: 30 }, body =>
      assert(body.totalSeconds === 60 && body.sessionCount === 1, 'Heartbeat should extend the session'));

    await check('POST', '/groups', 403, student, { name: 'Smoke group', courseId });
    await check('POST', '/groups', 201, owner, { name: 'Smoke group', courseId },
      body => { groupId = body.group._id; });
    const group = '/groups/' + groupId;
    await check('GET', '/groups', 200, owner, undefined, body =>
      assert(body.groups.some(item => item._id === groupId), 'Owner group missing'));
    await check('GET', '/groups', 200, other, undefined, body =>
      assert(!body.groups.some(item => item._id === groupId), 'Group leaked to another instructor'));
    await check('PUT', group, 403, other, { name: 'Forbidden edit' });
    await check('PUT', group, 200, owner, { name: 'Smoke group updated' });
    await check('POST', group + '/members', 403, owner, { studentId: outside?.user.id });
    await check('POST', group + '/members', 200, owner, { studentId });
    await check('GET', '/my-groups', 200, student, undefined, body =>
      assert(body.groups.some(item => item._id === groupId), 'Membership missing'));
    await check('DELETE', group + '/members/' + studentId, 200, owner);

    await check('POST', '/events', 403, other, event);
    await check('POST', '/events', 400, owner, { ...event, endsAt: event.startsAt });
    await check('POST', '/events', 201, owner, event, body => { eventId = body.event._id; });
    await check('GET', calendar, 200, student, undefined, body =>
      assert(body.events.some(item => item._id === eventId), 'Enrolled student cannot see event'));
    await check('GET', calendar, 200, outside?.token, undefined, body =>
      assert(!body.events.some(item => item._id === eventId), 'Event leaked to an unenrolled student'));
    await check('PUT', '/events/' + eventId, 403, other, event);
    await check('PUT', '/events/' + eventId, 200, owner, { ...event, title: 'Updated smoke lecture' });
    await check('DELETE', '/events/' + eventId, 200, owner);
    await check('DELETE', group, 200, owner);

    await check('GET', '/messages/contacts', 200, student, undefined, body =>
      assert(body.contacts.some(item => item._id === instructorId), 'Course instructor missing from contacts'));
    await check('POST', '/messages', 403, outside?.token, { recipientId: instructorId, body: 'Forbidden' });
    await check('POST', '/messages', 201, student, { recipientId: instructorId, body: 'Smoke message' });
    await check('GET', '/messages/conversations', 200, owner, undefined, body =>
      assert(body.conversations.some(row => row.contact._id === studentId && row.unreadCount === 1), 'Expected unread message'));
    await check('GET', '/messages/with/' + studentId, 403, other);
    await check('GET', '/messages/with/' + studentId, 200, owner, undefined, body =>
      assert(body.messages.some(item => item.body === 'Smoke message' && item.readAt), 'Thread should mark messages read'));

    let notificationId;
    await check('GET', '/notifications', 200, owner, undefined, body => {
      notificationId = body.notifications.find(item => item.type === 'message')?._id;
      assert(notificationId && body.unreadCount, 'Expected an unread message notification');
    });
    await check('PATCH', '/notifications/' + notificationId + '/read', 404, student);
    await check('PATCH', '/notifications/' + notificationId + '/read', 200, owner);
    await check('PATCH', '/notifications/read-all', 200, owner);
    await check('GET', '/notifications', 200, owner, undefined, body =>
      assert(body.unreadCount === 0, 'Notifications still unread'));

    const evaluation = { courseId, studentId, score: 90, feedback: 'Good work.' };
    await check('PUT', '/evaluations', 403, other, evaluation);
    await check('PUT', '/evaluations', 200, owner, evaluation);
    await check('GET', '/evaluations', 200, student, undefined, body =>
      assert(body.evaluations.some(item => item.score === 90), 'Student evaluation missing'));
    await check('GET', '/instructor/students?courseId=' + courseId, 200, owner, undefined, body =>
      assert(body.students.some(row => row.studentId === studentId && row.evaluation?.score === 90), 'Inline evaluation missing'));

    await check('POST', '/courses', 201, owner, { title: 'Path fixture ' + runId, description: 'Extra course for path checks.',
      category: 'Programming', level: 'Advanced', durationHours: 2, originalPrice: 10 },
      body => { extraCourseId = body.course._id; });
    await check('PUT', '/courses/' + extraCourseId, 200, owner, { durationHours: 3 });
    await check('GET', '/courses/' + extraCourseId, 200, undefined, undefined, body => {
      const course = body.course;
      assert(course.level === 'Advanced' && course.durationHours === 3 && course.originalPrice === 10, 'Course metadata mismatch');
    });
    const path = { title: 'Smoke path', description: 'Course sequence', courses: [courseId, extraCourseId] };
    await check('POST', '/learning-paths', 403, owner, { ...path, courses: [courseId, secondCourseId] });
    await check('POST', '/learning-paths', 201, owner, path, body => { pathId = body.path._id; });
    await check('GET', '/learning-paths', 200, student, undefined, body =>
      assert(body.paths.some(item => item._id === pathId), 'Path missing'));
    await check('GET', '/learning-paths/' + pathId, 200, student, undefined, body =>
      assert(body.path.courses[1].status === 'not enrolled', 'Missing course status'));
    await check('PUT', '/learning-paths/' + pathId, 403, other, path);
    await check('PUT', '/learning-paths/' + pathId, 200, owner, { ...path, courses: [...path.courses].reverse() });
    await check('DELETE', '/learning-paths/' + pathId, 200, owner);

    const search = '/search?q=' + encodeURIComponent('Path fixture ' + runId);
    await check('GET', search, 200, owner, undefined, body =>
      assert(body.courses.some(item => item._id === extraCourseId), 'Search must include owned matches'));
    await check('GET', search, 200, student, undefined, body =>
      assert(body.students.length === 0, 'Student search exposed accounts'));
    await check('PUT', '/me', 200, student, { name: 'Smoke Learner', headline: 'Learning React' },
      body => assert(body.user.headline === 'Learning React' && !body.user.password, 'Unexpected profile response'));
    await check('PUT', '/me/password', 400, student, { currentPassword: 'Incorrect123', newPassword: 'Changed123' });
    await check('PUT', '/me/password', 200, student, { currentPassword: context.password, newPassword: 'Changed123' });
  } finally {
    if (extraCourseId) await check('DELETE', '/courses/' + extraCourseId, 200, owner);
    if (outside?.user.id) await check('DELETE', '/admin/users/' + outside.user.id, 200, admin);
  }
};
