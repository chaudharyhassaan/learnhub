const path = require('path');
const jwt = require('jsonwebtoken');

const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const asyncHandler = require('../utils/asyncHandler');
const removeFile = require('../utils/files');
const recalculateProgress = require('../utils/progress');
const { UPLOAD_DIR } = require('../middleware/upload');

// The lesson type is decided on the server from the uploaded mimetype, never by the client.
const TYPE_BY_MIME = {
  'video/mp4': 'video',
  'application/pdf': 'pdf',
  'image/png': 'image',
  'image/jpeg': 'image',
};

// IDOR helper: the owner id always comes from the token, never from the body.
function isOwner(course, user) {
  return String(course.instructor) === String(user.id);
}

// Only these four fields are safe to show in a public lesson list.
function lessonSummary(lesson) {
  return {
    _id: lesson._id,
    title: lesson.title,
    type: lesson.type,
    order: lesson.order,
  };
}

// GET /api/courses/:courseId/lessons (public)
const getCourseLessons = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId).select('_id');

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const lessons = await Lesson.find({ course: course._id })
    .select('_id title type order')
    .sort({ order: 1 })
    .lean();

  // Map the result explicitly too, so file names and URLs can never leak
  // even if the select projection is changed later.
  return res.status(200).json(lessons.map(lessonSummary));
});

// POST /api/courses/:courseId/lessons (owner instructor or admin)
const createLesson = asyncHandler(async (req, res) => {
  // Multer already saved the file before this runs, so every early exit must clean it up.
  async function removeUploadedFile() {
    if (req.file) {
      await removeFile(req.file.filename);
    }
  }

  const course = await Course.findById(req.params.courseId);

  if (!course) {
    await removeUploadedFile();
    return res.status(404).json({ message: 'Course not found' });
  }

  if (!isOwner(course, req.user) && req.user.role !== 'admin') {
    await removeUploadedFile();
    return res.status(403).json({ message: 'You can only add lessons to your own courses.' });
  }

  const contentUrl = req.body.contentUrl ? String(req.body.contentUrl).trim() : '';

  // A lesson needs something to open: an uploaded file or an external link.
  if (!req.file && !contentUrl) {
    return res.status(400).json({ message: 'Add a file or a link for this lesson.' });
  }

  const lessonCount = await Lesson.countDocuments({ course: course._id });

  let lesson;

  try {
    lesson = await Lesson.create({
      course: course._id,
      title: String(req.body.title).trim(),
      type: req.file ? TYPE_BY_MIME[req.file.mimetype] : 'link',
      // Only the random stored name is kept. The uploads folder is never public.
      filePath: req.file ? req.file.filename : '',
      originalName: req.file ? req.file.originalname : '',
      mimeType: req.file ? req.file.mimetype : '',
      size: req.file ? req.file.size : 0,
      contentUrl,
      order: lessonCount + 1,
    });
  } catch (error) {
    // Do not leave an orphan file behind when the database rejects the lesson.
    await removeUploadedFile();
    throw error;
  }

  return res.status(201).json(lessonSummary(lesson));
});

// DELETE /api/lessons/:id (owner instructor or admin)
const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    return res.status(404).json({ message: 'Lesson not found' });
  }

  const course = await Course.findById(lesson.course);

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (!isOwner(course, req.user) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'You can only delete your own lessons.' });
  }

  // Delete the stored file first, then the record that points at it.
  await removeFile(lesson.filePath);
  await lesson.deleteOne();

  // Remove the id from every enrollment and recalculate so progress stays honest.
  const enrollments = await Enrollment.find({ course: lesson.course });

  for (const enrollment of enrollments) {
    enrollment.completedLessons = enrollment.completedLessons.filter(
      (id) => String(id) !== String(lesson._id)
    );
    await recalculateProgress(enrollment);
    await enrollment.save();
  }

  return res.status(200).json({ message: 'Lesson deleted' });
});

// GET /api/lessons/:id/access (enrolled student, owner instructor or admin)
const getLessonAccess = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);

  if (!lesson) {
    return res.status(404).json({ message: 'Lesson not found' });
  }

  const course = await Course.findById(lesson.course).select('instructor');

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  let allowed = req.user.role === 'admin' || isOwner(course, req.user);

  if (!allowed && req.user.role === 'student') {
    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: lesson.course,
    }).select('_id');

    allowed = Boolean(enrollment);
  }

  if (!allowed) {
    return res.status(403).json({ message: 'Enrol in this course to open its lessons.' });
  }

  // A signed short lived link means the file route needs no login header and
  // cannot be shared forever.
  let fileUrl = null;

  if (lesson.filePath && lesson.type !== 'link') {
    const token = jwt.sign(
      { lessonId: String(lesson._id), purpose: 'file' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    fileUrl = `/api/files/${token}`;
  }

  return res.status(200).json({
    lesson: {
      _id: lesson._id,
      title: lesson.title,
      type: lesson.type,
      contentUrl: lesson.contentUrl,
    },
    fileUrl,
  });
});

// GET /api/files/:token (the signed token is the authorisation)
const getFile = asyncHandler(async (req, res) => {
  let payload;

  try {
    payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ message: 'This file link is invalid or has expired.' });
  }

  if (payload.purpose !== 'file' || !payload.lessonId) {
    return res.status(401).json({ message: 'This file link is invalid or has expired.' });
  }

  const lesson = await Lesson.findById(payload.lessonId);

  if (!lesson || !lesson.filePath) {
    return res.status(404).json({ message: 'File not found' });
  }

  // basename plus resolve keeps the path inside uploads, even if the database
  // ever held something like ../../.env.
  const filePath = path.resolve(UPLOAD_DIR, path.basename(lesson.filePath));

  // Inline so the browser can show the PDF or play the video instead of downloading it.
  res.set('Content-Disposition', 'inline');
  res.set('Cache-Control', 'private, no-store');

  // Only this route relaxes the Helmet defaults so the frontend origin can embed
  // the file. Every other route keeps the strict defaults.
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  res.removeHeader('X-Frame-Options');

  const frameAncestors = process.env.CLIENT_URL.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .join(' ');

  res.set('Content-Security-Policy', `frame-ancestors ${frameAncestors}`);

  // sendFile streams the file and supports Range requests, which video playback needs.
  return res.sendFile(filePath, (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({ message: 'File not found' });
    }
  });
});

module.exports = {
  getCourseLessons,
  createLesson,
  deleteLesson,
  getLessonAccess,
  getFile,
};
