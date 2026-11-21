// Why: dotenv must run before any other file reads process.env.
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Fail fast and name the missing keys, so a bad .env file is easy to fix.
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  console.error(`Missing required environment variable(s): ${missingEnv.join(', ')}`);
  console.error('Copy backend/.env.example to backend/.env and fill in the values.');
  process.exit(1);
}

const app = express();

// Render and similar hosts put the app behind a proxy. Without this, Express sees the
// proxy IP and express-rate-limit would throttle every user as if they were one client.
app.set('trust proxy', 1);

// Secure HTTP headers.
app.use(helmet());

// Only the configured frontend may call the API. A comma-separated list is allowed,
// so local development and a deployed frontend can both be trusted.
const allowedOrigins = process.env.CLIENT_URL.split(',').map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins }));

// The API only accepts JSON, so a small limit is enough and blocks huge payloads.
app.use(express.json({ limit: '10kb' }));

// Removes $ and . from request input, which stops common NoSQL injection attempts.
app.use(mongoSanitize());

// Request logs help while developing but are noise in production.
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Public check used by hosting platforms and by the frontend to confirm the API is up.
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ----------------------------- ROUTES GO HERE -----------------------------
// Later tasks mount their route files here, for example:
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/courses', require('./routes/courseRoutes'));
// --------------------------------------------------------------------------

// Unknown URLs and thrown errors are handled last, in that order.
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Why: the API should only accept traffic once the database is reachable.
async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
