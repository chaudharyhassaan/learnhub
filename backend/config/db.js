const mongoose = require('mongoose');

// One connection helper so server.js stays short and startup stops early
// when the database cannot be reached.
async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // Only the host is logged, never the full URI, because it holds the password.
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
