const fs = require('fs/promises');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Why: deleting a lesson must also delete its stored file, but a file that is
// already gone should not stop the request. basename keeps the delete inside uploads.
async function removeFile(storedName) {
  if (!storedName) {
    return;
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(storedName));

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

module.exports = removeFile;
