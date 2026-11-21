const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Make sure the folder exists on a fresh clone, because git only keeps .gitkeep.
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Extension and mimetype must BOTH match, so a renamed .exe cannot sneak through.
const ALLOWED_TYPES = {
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    // Random name plus the original extension. The original name is stored in
    // the database only, so two uploads can never overwrite each other.
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomBytes(16).toString('hex') + extension);
  },
});

function fileFilter(req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();
  const expectedMime = ALLOWED_TYPES[extension];

  if (expectedMime && expectedMime === file.mimetype) {
    return cb(null, true);
  }

  const error = new Error('Only PDF, MP4, PNG and JPG files up to 50 MB are allowed.');
  error.statusCode = 400;
  return cb(error);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 1,
  },
});

module.exports = { upload, UPLOAD_DIR };
