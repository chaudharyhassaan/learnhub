# LearnHub

LearnHub is a MERN learning management system for browsing courses, publishing lessons, and tracking learning progress. Students enroll and continue lessons from their dashboards, instructors manage course content, and administrators manage accounts and review platform activity.

- Repository: [chaudharyhassaan/learnhub](https://github.com/chaudharyhassaan/learnhub)
- Live frontend: [Vercel URL]
- Live API: [Render URL]

## Screenshots

- [Add home page and course catalogue screenshots]
- [Add student lesson viewer, instructor dashboard, and admin overview screenshots]

## Features by role

| Role | Features |
| --- | --- |
| Visitor | Browse, search, filter and sort the catalogue, view course details, and register as a student or instructor. |
| Student | Enroll, open lessons, mark lessons complete, and track course progress. |
| Instructor | Create and manage owned courses, publish file or link lessons, and see enrollment counts. |
| Admin | Review analytics and audit activity, change user roles, remove accounts, and manage courses. |

## Technologies used

- Frontend: React, Vite, React Router, Axios, React Bootstrap.
- Backend: Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcryptjs, Multer, Helmet, express-validator, express-rate-limit.

## Project structure

```text
learnhub/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── postman/
│   ├── routes/
│   ├── scripts/
│   ├── uploads/
│   ├── utils/
│   ├── seed.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   └── vercel.json
└── docs/
```

## Installation

Use Git, Node.js 22.12+ on the 22.x line or a newer supported LTS release, npm, and a MongoDB Atlas cluster with a database user and network access configured. The commands below are for Windows PowerShell.

```powershell
git clone https://github.com/chaudharyhassaan/learnhub.git
cd learnhub/backend
npm.cmd install
Copy-Item .env.example .env
```

Set the Atlas connection string, a long random JWT secret, and your chosen seed admin credentials in the local backend environment file. Keep `NODE_ENV=development`, `PORT=5000`, and `CLIENT_URL=http://localhost:5173,http://localhost:4173` for local development and preview.

**The seed command replaces users, courses, lessons, enrollments, and audit logs in the configured database.** Run it only against a dedicated demo database you intend to reset.

```powershell
npm.cmd run seed
npm.cmd run dev
```

In another terminal, from the repository root:

```powershell
cd frontend
npm.cmd install
Copy-Item .env.example .env
npm.cmd run dev
```

Set `VITE_API_URL=http://localhost:5000/api` in the local frontend environment if it differs from the example. Open <http://localhost:5173>. Check the API at <http://localhost:5000/api/health>.

To test the production bundle locally, leave the backend running and run these commands in `frontend/`. Open <http://localhost:4173> and confirm the catalogue loads and a direct visit to `/courses` works.

```powershell
npm.cmd run build
npm.cmd run preview -- --port 4173 --strictPort
```

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | Value of `SEED_ADMIN_EMAIL` | Value of `SEED_ADMIN_PASSWORD` |
| Instructor | `amina@learnhub.test`, `daniel@learnhub.test` | `Password123` |
| Student | `sara@learnhub.test`, `ali@learnhub.test`, `mei@learnhub.test`, `tom@learnhub.test` | `Password123` |

These instructor and student credentials are for the demo database. Choose a private password for the admin account.

## API reference

Protected requests use `Authorization: Bearer <token>`.

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Check API availability. |
| GET | `/api/stats` | Public | Read landing-page totals. |
| GET | `/api/categories` | Public | List course categories. |
| POST | `/api/register` | Public | Create a student or instructor account. |
| POST | `/api/login` | Public | Sign in and receive a JWT. |
| GET | `/api/me` | Signed in | Read the current account. |
| GET | `/api/courses` | Public | Search, filter, sort, and paginate courses. |
| GET | `/api/courses/mine` | Instructor, admin | List courses owned by the current user. |
| GET | `/api/courses/:id` | Public | Read a course and its counts. |
| POST | `/api/courses` | Instructor, admin | Create a course. |
| PUT | `/api/courses/:id` | Course owner, admin | Update a course. |
| DELETE | `/api/courses/:id` | Course owner, admin | Delete a course and its lessons and enrollments. |
| GET | `/api/courses/:courseId/lessons` | Public | List lesson summaries. |
| POST | `/api/courses/:courseId/lessons` | Course owner, admin | Add a file or link lesson with multipart form data. |
| GET | `/api/lessons/:id/access` | Enrolled student, course owner, admin | Get lesson content or a signed file URL. |
| DELETE | `/api/lessons/:id` | Course owner, admin | Delete a lesson. |
| GET | `/api/files/:token` | Valid signed token | Stream an authorized file. |
| POST | `/api/enroll` | Student | Enroll in a course. |
| GET | `/api/my-courses` | Student | List the current student's enrollments. |
| GET | `/api/my-courses/:courseId` | Enrolled student | Read lessons and progress. |
| PATCH | `/api/my-courses/:courseId/lessons/:lessonId` | Enrolled student | Update lesson completion. |
| GET | `/api/admin/users` | Admin | Search and paginate users. |
| PATCH | `/api/admin/users/:id/role` | Admin | Change another user's role. |
| DELETE | `/api/admin/users/:id` | Admin | Delete an eligible account. |
| GET | `/api/admin/analytics` | Admin | Read platform analytics. |
| GET | `/api/admin/audit-logs` | Admin | List recent administrative activity. |

## Security

- bcryptjs hashes passwords before storage.
- JWT authentication, role checks, and ownership rules protect restricted operations.
- Request validation and MongoDB input sanitization reject malformed inputs.
- Helmet sets security headers and CORS matches configured frontend origins.
- API rate limits apply globally, with stricter limits for login and registration.
- Uploads are limited to PDF, MP4, PNG, and JPEG up to 50 MB. Private files use short-lived signed URLs.
- The API returns generic unexpected server errors in production and records administrative actions in the audit log.

## Deployment

### Render backend

Connect `chaudharyhassaan/learnhub` as a Node Web Service and deploy the `main` branch. [Render Web Services](https://render.com/docs/web-services)

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Build command | `npm ci` |
| Start command | `npm start` (runs `node server.js`) |
| Health check path | `/api/health` |

| Environment variable | Value |
| --- | --- |
| `PORT` | Use the value Render supplies. |
| `NODE_ENV` | `production` |
| `MONGO_URI` | Atlas connection string for the deployed database. |
| `JWT_SECRET` | A long, random secret stored in Render. |
| `JWT_EXPIRES_IN` | `7d` or the desired token lifetime. |
| `CLIENT_URL` | Exact Vercel origin with HTTPS and no trailing slash. Separate multiple permitted origins with commas. |
| `SEED_ADMIN_EMAIL` | Required only when running the seed script. |
| `SEED_ADMIN_PASSWORD` | Required only when running the seed script. |

Allow the Render service to reach Atlas. On startup the API creates the upload directory if needed, reads the port from the environment, and trusts one reverse-proxy hop. Visit `<Render URL>/api/health` after deployment.

### Vercel frontend

Import `chaudharyhassaan/learnhub` from GitHub. [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | `frontend` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Start command | Vercel serves the static output. |
| Environment variable | Set `VITE_API_URL` to `<Render URL>/api`. |

After Vercel assigns the frontend URL, set that exact origin in Render's `CLIENT_URL` and redeploy the backend. The Vercel rewrite serves `index.html` on direct visits to React Router paths. Rebuild the frontend after changing `VITE_API_URL`.

## Known limitations

- Enrollment is free and displayed course prices are informational. The project has no payment processing.
- Render's free tier uses an ephemeral disk. Uploaded files can disappear after a redeploy or restart. Link lessons are unaffected. [Render free service limitations](https://render.com/docs/free)

## Author

- Name: [Your name]
- Batch: [Your batch]
