# LearnHub handoff for the next coding agent

Last updated: 27 November 2026. Read `AGENTS.md` first (rules), then this file (status).
Repository root: `D:\MERN STACK FINAL PROJECT\learnhub`.

## 1. Project

LearnHub is a MERN stack Learning Management System **website** (not a mobile app) for the
Hunarmand Punjab MERN Stack final project, Batch 3, 40 marks. Three roles: admin, instructor,
student.

### Instructor requirements checklist

Question 1 (React pages and basic API):

- [ ] React pages: Home, Course Listing, Course Detail, Login, Register
- [x] Express REST APIs
- [x] MongoDB models `User` and `Course`
- [ ] Axios used by the frontend
- [ ] Bootstrap / React Bootstrap styling

Question 2 (auth, roles, enrollment, deployment):

- [x] JWT authentication
- [x] bcrypt password hashing
- [x] `.env` configuration
- [x] Roles: Admin, Instructor, Student
- [ ] Protected routes on the frontend (backend guards are done)
- [x] `Enrollment` model with `POST /api/enroll` and `GET /api/my-courses`
- [x] Central error handling
- [ ] Deployment ready (Render backend, Vercel frontend)

Submission list: GitHub link, live link, one PDF report with screenshots, README, original work.

## 2. Stack and decisions

- Frontend: Vite + React, **JavaScript only**, React Router, Axios, React Bootstrap, Bootstrap,
  react-bootstrap-icons, `@fontsource/poppins` and `@fontsource/manrope`.
- Backend: Node, **Express 4**, MongoDB Atlas with Mongoose, JWT, bcryptjs, Multer, Helmet,
  express-validator, express-rate-limit, express-mongo-sanitize, morgan, cors, dotenv.
- Deploy: Render for the backend, Vercel for the frontend.
- Light theme only. No TypeScript, Redux, Next.js, GraphQL, Docker, Tailwind, shadcn or test
  frameworks.
- Code must stay simple enough for the student to explain in a viva.

## 3. Current status

### Done and committed

Backend is complete. Commits:

```
0676bfc test(backend): smoke tests, Postman collection, fixes   (Prompt 7)
b712532 feat(backend): admin, analytics, audit log, seed        (Prompt 6)
c22abea feat(backend): enrollment and progress                  (Prompt 5)
bafc618 feat(backend): lesson upload with Multer and private file access
952acae feat(backend): courses CRUD with ownership checks
54414f0 feat(backend): JWT auth, roles, validation, rate limiting
7b8d706 feat(backend): foundation, models, error handling
```

- Smoke test: **83 of 83 checks pass** (`npm run test:smoke`).
- 49-request Postman collection in `backend/postman/`.
- `npm audit` reported 0 vulnerabilities.

### Frontend right now: Prompt 8 is NOT done

Commit `ee3d3cc chore(frontend): vite scaffold (Prompt 8 not finished)` contains **only the
Vite scaffold**. This is not the foundation task.

What exists in `frontend/`:

```
frontend/
  index.html, vite.config.js, package.json, .gitignore, .oxlintrc.json, README.md
  public/favicon.svg, public/icons.svg
  src/main.jsx        Vite boilerplate (StrictMode + createRoot, imports index.css)
  src/App.jsx         Vite demo component (counter, logos, "Get started")
  src/App.css, src/index.css, src/assets/ (hero.png, react.svg, vite.svg)
```

What is **missing** (nothing below is installed or created yet):

- Packages: `react-router-dom`, `axios`, `react-bootstrap`, `bootstrap`,
  `react-bootstrap-icons`, `@fontsource/poppins`, `@fontsource/manrope`.
- `frontend/node_modules` (run `npm.cmd install` first).
- Folders: `components/common`, `components/layout`, `pages/public`, `pages/student`,
  `pages/instructor`, `pages/admin`, `services`, `routes`, `context`, `styles`, `utils`.
- `styles/tokens.css`, `styles/theme.css`, `vercel.json`, `frontend/.env`,
  `frontend/.env.example`, `public/images/`.
- `AuthContext`, `AppRoutes`, `ProtectedRoute`, any placeholder page.

Current `package.json` dependencies are only React 19, ReactDOM 19, Vite 8, the React plugin,
`@types/*` and `oxlint` (linter only, scripts: `dev`, `build`, `lint`, `preview`).

### GitHub remote

**None set.** `git remote -v` is empty. The owner must create the repo and add the remote.

## 4. Backend reference

Base URL: `http://localhost:5000/api`. Auth header: `Authorization: Bearer <token>`.
Frontend token key in `localStorage`: **`learnhub_token`**.

| Method | Path | Role |
| --- | --- | --- |
| GET | `/api/health` | Public |
| GET | `/api/stats` | Public |
| GET | `/api/categories` | Public |
| POST | `/api/register` | Public (role: student or instructor only) |
| POST | `/api/login` | Public |
| GET | `/api/me` | Any logged in user |
| GET | `/api/courses` | Public |
| GET | `/api/courses/mine` | Instructor, Admin |
| GET | `/api/courses/:id` | Public |
| POST | `/api/courses` | Instructor, Admin |
| PUT | `/api/courses/:id` | Owner instructor, Admin |
| DELETE | `/api/courses/:id` | Owner instructor, Admin |
| GET | `/api/courses/:courseId/lessons` | Public |
| POST | `/api/courses/:courseId/lessons` | Owner instructor, Admin (multipart) |
| GET | `/api/lessons/:id/access` | Any logged in user (controller checks access) |
| DELETE | `/api/lessons/:id` | Owner instructor, Admin |
| GET | `/api/files/:token` | Public, the signed token is the authorisation |
| POST | `/api/enroll` | Student |
| GET | `/api/my-courses` | Student |
| GET | `/api/my-courses/:courseId` | Student (must be enrolled) |
| PATCH | `/api/my-courses/:courseId/lessons/:lessonId` | Student (must be enrolled) |
| GET | `/api/admin/users` | Admin |
| PATCH | `/api/admin/users/:id/role` | Admin |
| DELETE | `/api/admin/users/:id` | Admin |
| GET | `/api/admin/analytics` | Admin |
| GET | `/api/admin/audit-logs` | Admin |

Query parameters on `GET /api/courses`: `search`, `category`, `sort`
(`newest` | `price_asc` | `price_desc`), `page`, `limit` (max 50).
Admin user list: `search`, `page`, `limit`.

### Response shapes

- Course list: `{ courses, page, pages, total }`
- Single course: `{ course }` (also has `lessonCount`, `enrolledCount`)
- Instructor course list: `{ courses }` (each has `lessonCount`, `enrolledCount`)
- My courses: `{ courses: [{ enrollmentId, progress, completedCount, course }] }`
- My course detail: `{ course, progress, lessons: [{ _id, title, type, order, completed }] }`
- Enroll: `201 { enrollment }`
- Progress update: `{ progress, completed }`
- Lesson list: **a bare array** of lesson summaries (not wrapped)
- Lesson access: `{ lesson, fileUrl }`
- Auth: `{ token, user }`; `GET /api/me` returns `{ user }`
- Stats: `{ courses, learners, instructors }`
- Admin users: `{ users, page, pages, total }`
- Admin analytics: `{ totals: { users, courses, enrollments, lessons }, usersByRole,
  topCourses, enrollmentsLast7Days, averageProgress }`
- Audit logs: `{ logs: [...] }`
- Categories: array of `Programming, Design, Business, Marketing, Data, Language, Other`

### Errors

`{ "message": "plain English sentence" }`, plus
`"errors": { "fieldName": "how to fix it" }` for validation failures.
Status codes: 200, 201, 400, 401, 403, 404, 409, 429, 500.

### Private file flow

1. `GET /api/lessons/:id/access` (Bearer token) returns `{ lesson, fileUrl }` where `fileUrl`
   is `/api/files/<signed token>` (relative, short lived).
2. The browser then requests `GET /api/files/:token` with no auth header.
3. Frontend must prefix the API origin, **not** the `/api` suffix. Example: from
   `http://localhost:5000/api` the file URL is `http://localhost:5000/api/files/...`.
4. Link lessons have `contentUrl` instead and no signed file.

### Rate limits

- Whole `/api`: 100 requests per 15 minutes per IP.
- `POST /api/login` and `POST /api/register`: 10 per 15 minutes per IP.
- Both return `429 { message: "Too many attempts. Please wait a few minutes and try again." }`

### Commands (run in `backend/`)

```
npm.cmd install
npm.cmd run dev        # nodemon
npm.cmd run seed       # demo data
npm.cmd run test:smoke # 83 checks, needs the API running
npm.cmd start          # production
```

## 5. Environment variables (names only)

Backend (`backend/.env`, copy from `backend/.env.example`):
`PORT`, `NODE_ENV`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`,
`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

Frontend (`frontend/.env`, to be created in Prompt 8): `VITE_API_URL`
(local value: `http://localhost:5000/api`).

Never read, print or commit `.env` files. Only `.env.example` is committed.

## 6. Demo accounts (from `backend/seed.js`)

Password for all six: `Password123`

- Instructors: `amina@learnhub.test`, `daniel@learnhub.test`
- Students: `sara@learnhub.test`, `ali@learnhub.test`, `mei@learnhub.test`,
  `tom@learnhub.test`

The admin account is created only from `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in
`backend/.env`. Never print those values.

## 7. Design system

`AGENTS.md` is the single source of truth for the palette (`--lh-*` tokens), fonts
(Poppins headings, Manrope body), the 4px spacing grid, radii, shadows, interaction states
and the banned cliche list. Do not invent a second system.

## 8. Known issues and gotchas

- PowerShell blocks `npm.ps1`. Always use `npm.cmd` / `npx.cmd`, or run in `cmd`.
- The owner's network cannot resolve DNS TXT records, so the local `MONGO_URI` uses a non-SRV
  `mongodb://` string. Render may use `mongodb+srv://`.
- `nodemon` is pinned to `3.1.11`.
- Express must stay on version 4 (`express-mongo-sanitize` is incompatible with 5).
- Render's free disk is ephemeral: uploaded files can disappear after a restart or redeploy.
  Link lessons are unaffected.
- Windows CRLF warnings from git are harmless.
- Root `README.md` is still the skeleton placeholder; Prompt 17 replaces it.

## 9. Remaining work

The full prompt text lives in `docs/prompts/LearnHub_Prompts_copy_paste.md`.
**Prompts 8 to 17 are all still to do.** Prompts 0 to 7 are done.

8. **Frontend foundation** (NOT DONE): Vite cleanup, theme tokens, services, AuthContext,
   routing, protected routes, placeholder pages. Commit
   `feat(frontend): foundation, theme, services, auth, routing`.
9. Shared components and layouts (navbar, footer, sidebar, cards, modals, toasts). Commit
   `feat(frontend): shared components and layouts`.
10. Home landing page, 7 sections with live stats and featured courses. Commit
    `feat(frontend): landing page`.
11. Course listing with filters and pagination, plus course detail with role-aware enroll
    button. Commit `feat(frontend): course listing and detail`.
12. Login and Register with a shared AuthCard. Commit `feat(frontend): login and register`.
13. Student dashboard, my courses, lesson viewer with progress. Commit
    `feat(frontend): student dashboard, my courses and lesson viewer`.
14. Instructor dashboard, course form, lesson upload with progress bar. Commit
    `feat(frontend): instructor dashboard, course form and lesson upload`.
15. Admin overview with analytics, users, courses. Commit
    `feat(frontend): admin overview, users and courses`.
16. Polish and audit pass (states, a11y, responsive, design rules). Commit
    `chore(frontend): polish, accessibility and design audit`.
17. Deployment preparation and root README. Commit
    `docs: README and deployment preparation`.

Final deliverables: GitHub repo, live frontend on Vercel, backend on Render, one PDF report
with screenshots, complete README, demo accounts.

## 10. Working rules for the agent

1. Read `AGENTS.md` and this file before every task.
2. Do one prompt at a time, in order. Do not jump ahead or merge prompts.
3. Run the build and the checks the prompt asks for (`npm.cmd run build`, `npm.cmd run dev`,
   `npm.cmd run test:smoke`). Fix errors before committing.
4. Commit after each task with exactly the message the prompt gives.
5. Never read, print or edit `.env` files. Never commit secrets.
6. Ask the owner for anything that needs their accounts: MongoDB Atlas, GitHub, Render,
   Vercel.
7. Keep the code simple, commented and explainable in a viva. No extra libraries.
8. Do not start long-running servers yourself. Give the owner the command to run.
