# LearnHub OpenCode prompts (copy and paste)

Paste ONE prompt at a time. Copy only what is inside the code block.

## Prompt 0: Project skeleton and rules file (AGENTS.md)

````
Create the project skeleton and the rules file. Do not write any app code yet.

1. The current directory is the project root and is already named learnhub. Do NOT create another learnhub folder. Create two empty folders inside it: backend/ and frontend/. Run npm as npm.cmd on this Windows machine (PowerShell blocks npm.ps1).
2. Run git init. Create a root .gitignore with: node_modules, .env, .env.*, !.env.example, dist, build, .DS_Store, backend/uploads/* (keep backend/uploads/.gitkeep).
3. Create AGENTS.md at the repository root with EXACTLY the content between the BEGIN and END markers below (do not include the markers).
4. Make the first commit: "chore: project skeleton and rules".

===== BEGIN AGENTS.md =====
# LearnHub project rules (read before every task)

## What this is
LearnHub is a MERN stack Learning Management System. It is a WEBSITE (not a mobile app) for a university final project. Roles: admin, instructor, student.
It must be FUNCTIONAL and stay inside what a standard MERN course teaches: React (components, props, useState, useEffect, lists, conditional rendering, React Router), Axios, React Bootstrap, Node/Express, MongoDB/Mongoose, JWT, bcrypt, .env files.
Do NOT add TypeScript, Redux, Next.js, GraphQL, Docker, Tailwind, shadcn or test frameworks.
The student must explain every file in a viva, so keep code simple, readable and commented.

## Code style
- Plain JavaScript. Backend uses CommonJS (require). Frontend uses ES modules, function components and hooks.
- Add a short comment explaining WHY on every controller, middleware and non-trivial component.
- Small files, one job each. Descriptive names. No clever one-liners.
- Never hard-code secrets. All config comes from .env. Keep .env.example up to date.
- After every task: run the code, fix errors, then tell me what command to run and what I should see.
- Windows: run npm as npm.cmd because PowerShell blocks npm.ps1. Never read, print or edit .env files. Do not start long-running servers yourself.

## Layout (the repository root is the current folder, named learnhub)
  backend/   config, models, controllers, routes, middleware, utils, uploads, server.js
  frontend/  src/components, src/pages, src/services, src/routes, src/context, src/styles, src/utils

## API conventions
- Every route lives under /api and returns JSON.
- Errors: { "message": "plain English sentence" } and, for validation, also "errors": { "fieldName": "how to fix it" }.
- Status codes: 200, 201, 400, 401, 403, 404, 409, 429, 500.

## Security rules (apply to EVERY route you write)
- Auth on every route except: GET /api/health, GET /api/stats, GET /api/categories, GET /api/courses, GET /api/courses/:id, GET /api/courses/:courseId/lessons, POST /api/register, POST /api/login, GET /api/files/:token.
- Never trust the frontend. Validate and sanitize every body, param and query on the server (express-validator). Whitelist fields by name. NEVER pass req.body straight into Model.create or update.
- Stop IDOR: always check ownership. An instructor may only change their own courses and lessons. A student may only read their own enrollments. Admin may do everything. Take the user id from the JWT (req.user), never from the request body.
- Role is never set from the client except the register form, which may only choose student or instructor. Admin accounts come from the seed script.
- Block NoSQL injection: express-mongo-sanitize, type checks on inputs, validate ObjectIds before queries.
- Passwords: bcrypt hash, never returned in any response, never logged. Login errors are generic ("Invalid email or password").
- Helmet security headers, CORS locked to CLIENT_URL, rate limits (strict on login and register).
- Uploads: allow only PDF, MP4, PNG, JPG, max 50 MB, random file names, stored outside any public static folder, served only through an authorised route.
- Production: no stack traces or internal error text in responses. Log admin actions to the AuditLog collection.
- Run npm audit before finishing a phase.

## Design system (apply to EVERY screen)
Minimalist and calm. Fewer elements, more space. If an element does not help the user finish a task, remove it.

Colour tokens (CSS variables in src/styles/tokens.css):
  --lh-ink       #1A120E   darkest text, dark bands
  --lh-espresso  #3A2418   primary filled buttons, headings
  --lh-walnut    #6B4A2E   links, focus ring, secondary text on light
  --lh-caramel   #A88462   DECORATIVE ONLY (dividers, icons on dark). Never text on a light background (contrast 3.4:1)
  --lh-sand      #D5C4AE   soft surfaces, placeholders, text on dark
  --lh-stone     #4A4A46   body text, muted labels
  --lh-bg        #FBF8F3   page background (warm off-white)
  --lh-surface   #FFFFFF   cards, inputs
  --lh-line      rgba(58,36,24,0.12)   hairline borders (1px)
  --lh-success   #2F6B3F   --lh-danger #A63A2B
  Light theme only. Keep all colours in variables so dark mode could be added later by lifting surfaces, not inverting.

Typography (self-hosted with @fontsource):
  Poppins for headings: page title 36px/600, H1 24px/600, H2 22px/600, H3 20px/600, sub-head 18px and 16px/600.
  Manrope for body: 16px regular minimum, line-height 1.5, captions 14px (metadata only).
  Headings line-height 1.25. Paragraph max width 65ch. Bold the label, not everything.

Spacing and shape:
  - Everything on a 4px grid: 4, 8, 12, 16, 24, 32, 48, 64, 96.
  - Group by proximity: label 4px above its input, field-to-field 16px, section-to-section 64px (mobile) or 96px (desktop).
  - Inner radius = outer radius minus padding. Cards: radius 24px with 16px padding, so inner buttons, inputs and tags use 8px. Image inside a card with 8px padding uses 16px.
  - Soft shadows only: 0 8px 32px rgba(26,18,14,0.06). Hairline 1px borders, never heavy grey borders.
  - One filled button per section. Others are outline or text links.
  - Tap targets at least 44px high and wide.
  - Contrast at least 4.5:1 for text.

States: every interactive element needs distinct default, hover, focus-visible, active, disabled and loading looks.
  - Focus ring always visible: 2px solid --lh-walnut with 2px offset.
  - Hover = change to a darker SOLID colour. Never fade opacity.
  - Errors appear beside or under the field and say how to fix it ("Use at least 8 characters").
  - Empty states say what to do next and give one button.
  - Icons: react-bootstrap-icons, used sparingly (navigation, actions). Centre them on the text height (inline-flex, align-items center, gap 8px). Decorative icons get aria-hidden.

Avoid these AI-looking cliches:
  no purple-to-blue gradients; no gradient hero text; no emojis in headings; do not default to Inter; no coloured-border cards; no glassmorphism; no low-contrast dark mode; no row of three icon boxes; no pill or badge above the headline; do not overuse icons; no unstyled default Bootstrap look (every component must be themed); no fade-in-on-scroll animations; no cursor effects; no fading buttons on hover; no inconsistent spacing; avoid em dashes; no marketing buzzwords (no "revolutionise", "unlock", "seamless", "empower"); no serif italic accents; no grain or noise textures.
===== END AGENTS.md =====
````

Check before moving on: Folders backend/ and frontend/ exist, git is initialised, AGENTS.md is at the root.

## Prompt 1: Backend foundation: structure, database, models

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Build ONLY the backend foundation inside the backend/ folder. Do not touch frontend/.

1. SETUP
- npm init -y in backend/.
- Install: express@4 mongoose@8 dotenv cors helmet express-rate-limit express-mongo-sanitize express-validator bcryptjs jsonwebtoken multer morgan
- Install dev dependency: nodemon
- Scripts: "dev": "nodemon server.js", "start": "node server.js", "seed": "node seed.js"
- Create backend/.env.example with placeholders only:
  PORT=5000
  NODE_ENV=development
  MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/learnhub
  JWT_SECRET=replace-with-a-long-random-string
  JWT_EXPIRES_IN=7d
  CLIENT_URL=http://localhost:5173
  SEED_ADMIN_EMAIL=admin@learnhub.test
  SEED_ADMIN_PASSWORD=ChangeMe123
- Create backend/.gitignore (node_modules, .env, uploads/* but keep uploads/.gitkeep).

2. FOLDERS: config, models, controllers, routes, middleware, utils, uploads, plus server.js.

3. utils/constants.js
- ROLES = ['admin','instructor','student']
- CATEGORIES = ['Programming','Design','Business','Marketing','Data','Language','Other']
- LESSON_TYPES = ['video','pdf','image','link']

4. config/db.js
- connectDB(): mongoose.connect(process.env.MONGO_URI). On success log only the host name. On failure log a clear message and exit(1).

5. MODELS (all with timestamps: true)
- User: name (String, required, trim, 2-60), email (required, unique, lowercase, trim, email format), password (String, required, minlength 8, select: false), role (enum ROLES, default 'student').
  Pre-save hook: if password modified, hash with bcryptjs cost 12. Method comparePassword(plain). toJSON removes password and __v.
- Course: title (required, trim, 3-120), description (required, trim, 10-2000), instructor (ObjectId ref User, required), category (enum CATEGORIES, required), price (Number, min 0, default 0), thumbnail (String, default ''). Index on instructor and a text index on title+description.
- Lesson: course (ref Course, required), title (required, 2-120), type (enum LESSON_TYPES), filePath (stored file name, default ''), originalName (default ''), mimeType (default ''), size (Number, default 0), contentUrl (String, default ''), order (Number, default 0).
- Enrollment: student (ref User), course (ref Course), progress (Number 0-100, default 0), completedLessons ([ObjectId ref Lesson]). Unique compound index on { student, course } so nobody can enrol twice.
- AuditLog: actor (ref User), action (String), targetType (String), targetId (ObjectId), details (String, default '').

6. middleware/errorHandler.js
- notFound(req,res): 404 { message: 'Route not found' }.
- errorHandler(err,req,res,next): returns { message } with the right status. Handle Mongoose ValidationError (400), CastError (400 "Invalid id"), duplicate key 11000 (409), MulterError (400). In production never send err.stack or internal messages for 500 errors, just "Something went wrong. Please try again."
- utils/asyncHandler.js wrapper so controllers do not need try/catch everywhere.

7. server.js
- Load dotenv first. Check MONGO_URI, JWT_SECRET and CLIENT_URL exist, otherwise print which is missing and exit.
- app.set('trust proxy', 1) (needed on Render for rate limiting).
- Order: helmet, cors (origin from CLIENT_URL, comma-separated allowed), express.json({ limit: '10kb' }), mongoSanitize, morgan('dev') only when not production.
- GET /api/health returns { status: 'ok' }.
- Leave a clearly marked place where later route files will be mounted.
- Then notFound and errorHandler. Connect to DB first, then listen on PORT.

HOW I WILL CHECK: I add my Atlas string to backend/.env, run npm run dev, and open /api/health. Tell me exactly what to put in .env.
Commit: "feat(backend): foundation, models, error handling".
````

Check before moving on: Create backend/.env with your Atlas string and a long random JWT_SECRET. npm run dev prints the database host; /api/health returns status ok.

## Prompt 2: Authentication, JWT, roles, validation, rate limiting

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Add authentication to the backend. Do not touch frontend/.

FILES
- utils/generateToken.js: signs a JWT with payload { id } using JWT_SECRET and JWT_EXPIRES_IN.
- middleware/auth.js: protect
  Reads "Authorization: Bearer <token>". Verifies it, loads the user from the database (so deleted users are locked out), attaches req.user. Errors: 401 "Please log in to continue." (missing/invalid) and 401 "Your session has expired. Please log in again." (expired).
- middleware/roles.js: authorize(...roles). If req.user.role is not allowed: 403 "You do not have permission to do this."
- middleware/validate.js: runs express-validator results. If invalid, respond 400 { message: 'Please fix the highlighted fields.', errors: { field: 'message' } }. Also export validateObjectId(paramName) that returns 400 "Invalid id" for malformed ids.
- middleware/rateLimiters.js: apiLimiter (100 requests per 15 minutes per IP, applied to all /api routes) and authLimiter (10 per 15 minutes, applied to login and register). Return 429 { message: 'Too many attempts. Please wait a few minutes and try again.' }.
- controllers/authController.js and routes/authRoutes.js (mounted at /api).
- Mount in server.js: apiLimiter on /api, then authRoutes.

ENDPOINTS
POST /api/register
- Validate: name trimmed 2-60 chars; email valid and normalised; password at least 8 characters containing a letter and a number; role optional and ONLY 'student' or 'instructor' (default student). Any other value, including 'admin', returns 400 "Role must be student or instructor".
- Email already used: 409 "An account with this email already exists. Try logging in."
- Success 201: { token, user: { id, name, email, role } }.

POST /api/login
- Validate email and password are strings (this blocks NoSQL injection objects such as {"$gt": ""}).
- Find user with .select('+password'). Unknown email OR wrong password both return 401 "Invalid email or password".
- Success 200: { token, user: { id, name, email, role } }.

GET /api/me (protect)
- Returns { user: { id, name, email, role } }. The frontend uses this to restore a session.

RULES
- Passwords are never returned or logged.
- Use asyncHandler and the shared error format from AGENTS.md.
- Keep every file short and commented.

HOW I WILL CHECK: Postman requests for register, login (right and wrong password), register with role admin (must fail), and GET /api/me with and without a token.
Commit: "feat(backend): JWT auth, roles, validation, rate limiting".
````

Check before moving on: Register, login and GET /api/me work in Postman; role admin is rejected on register.

## Prompt 3: Courses API with ownership checks

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Build the Courses API. Do not touch frontend/.

FILES
- utils/audit.js: logAdminAction(req, action, targetType, targetId, details) creates an AuditLog entry with actor = req.user.id.
- utils/files.js: removeFile(storedName) deletes a file from backend/uploads and ignores "file not found".
- controllers/courseController.js, routes/courseRoutes.js (mounted at /api/courses), plus controllers/categoryController or a one-line route for GET /api/categories that returns CATEGORIES (public).
- Validation rules for course body in the routes file.

ENDPOINTS
GET /api/courses (public)
- Query: search (escape regex characters, case-insensitive match on title or description), category (must be in CATEGORIES, otherwise 400), sort (newest | price_asc | price_desc, default newest), page (default 1), limit (default 12, max 50).
- Response: { courses, page, pages, total }. Each course includes instructor { _id, name } and lessonCount. Get lessonCount with ONE aggregate for all courses on the page, not one query per course.

GET /api/courses/mine (protect, authorize instructor and admin)
- Courses created by the logged-in user, each with lessonCount and enrolledCount. Define this route BEFORE /:id.

GET /api/courses/:id (public)
- Same shape as above for one course, plus enrolledCount. 404 "Course not found" if missing.

POST /api/courses (protect, authorize instructor and admin)
- Validate: title 3-120, description 10-2000, category in CATEGORIES, price a number >= 0, thumbnail optional http/https URL.
- Whitelist those fields. The instructor is ALWAYS req.user.id, never taken from the body.
- Respond 201 with the created course.

PUT /api/courses/:id (protect, authorize instructor and admin)
- Only the owner or an admin may edit. Otherwise 403 "You can only edit your own courses."
- Same validation but every field optional. Whitelist fields. Respond 200 with the updated course.

DELETE /api/courses/:id (protect, authorize instructor and admin)
- Only the owner or an admin may delete (403 otherwise).
- Cascade: delete its lessons (and their files through removeFile) and its enrollments.
- If an admin deletes a course they do not own, call logAdminAction.

RULES
- Use validateObjectId('id') on every route with :id.
- Mount the routes in server.js.

HOW I WILL CHECK: create, list, filter, edit and delete courses in Postman as an instructor; try to edit another instructor's course (403) and create a course as a student (403) and without a token (401).
Commit: "feat(backend): courses CRUD with ownership checks".
````

Check before moving on: Course CRUD works; other instructor's course returns 403; student create returns 403.

## Prompt 4: Lessons, Multer upload and private file access

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Add lessons with real file upload (Multer) and private file access. Do not touch frontend/.

FILES
- middleware/upload.js (Multer):
  - diskStorage into backend/uploads (create the folder if missing). File name = crypto.randomBytes(16).toString('hex') + the original extension in lowercase. Never use the original name on disk.
  - fileFilter: accept ONLY .pdf (application/pdf), .mp4 (video/mp4), .png (image/png), .jpg/.jpeg (image/jpeg). Check BOTH extension and mimetype.
  - limits: fileSize 50 MB, files 1.
  - On rejection return 400 "Only PDF, MP4, PNG and JPG files up to 50 MB are allowed."
- controllers/lessonController.js, routes/lessonRoutes.js.
- utils/progress.js: recalculateProgress(enrollment) sets progress = round(completedLessons that still exist / total lessons in the course * 100), 0 if no lessons.

ENDPOINTS
GET /api/courses/:courseId/lessons (public)
- Returns ONLY [{ _id, title, type, order }] sorted by order. Never return file names or URLs here.

POST /api/courses/:courseId/lessons (protect, authorize instructor and admin; owner or admin only)
- multipart/form-data. Fields: title (required, 2-120), contentUrl (optional http/https URL), file (optional, field name "file"). Either a file or a contentUrl is required, otherwise 400 "Add a file or a link for this lesson."
- type is derived from the mimetype (video, pdf, image) or 'link' when only a URL is given.
- order = current lesson count + 1.
- If validation fails after Multer already saved a file, delete that file.
- Respond 201 with { _id, title, type, order }.

DELETE /api/lessons/:id (protect; owner of the course or admin)
- Delete the lesson, delete its file, remove the lesson id from every enrollment's completedLessons and recalculate their progress. 403 for anyone else.

GET /api/lessons/:id/access (protect)
- Allowed for: a student enrolled in that course, the owning instructor, or an admin. Otherwise 403 "Enrol in this course to open its lessons."
- Returns { lesson: { _id, title, type, contentUrl }, fileUrl }. fileUrl is "/api/files/<token>" where token is a JWT signed with JWT_SECRET, payload { lessonId, purpose: 'file' }, expiring in 5 minutes. For link lessons fileUrl is null.

GET /api/files/:token (no Authorization header; the signed token is the authorisation)
- Verify the token and purpose. Look up the lesson, then res.sendFile the stored file from backend/uploads (resolve the path from the database file name only, so path traversal is impossible). sendFile gives video range support.
- Set Content-Disposition: inline, Cache-Control: private, no-store.
- Because the frontend is on a different origin, for THIS route only: set Cross-Origin-Resource-Policy: cross-origin, remove X-Frame-Options and set Content-Security-Policy: frame-ancestors <CLIENT_URL>. Keep Helmet defaults for every other route.
- Do NOT serve backend/uploads with express.static.

RULES
- Mount routes in server.js. Use validateObjectId on every id param.

HOW I WILL CHECK: upload a PDF, an MP4 and a .exe (must be rejected) as the instructor; open the signed URL; try it as a student who is not enrolled (403); wait 5 minutes and confirm the URL expires.
Commit: "feat(backend): lesson upload with Multer and private file access".
````

Check before moving on: PDF and MP4 upload; .exe rejected; signed URL opens the file; non-enrolled student gets 403.

## Prompt 5: Enrollment and progress

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Build enrollment and progress. Do not touch frontend/.

FILES: controllers/enrollmentController.js, routes/enrollmentRoutes.js (mounted at /api). Reuse utils/progress.js.

ENDPOINTS (all protect + authorize('student'))
POST /api/enroll
- Body { courseId }. Validate it is a valid ObjectId and the course exists (404 "Course not found").
- Already enrolled: 409 "You are already enrolled in this course."
- Create the enrollment for req.user.id (never from the body). Respond 201 with { enrollment }.

GET /api/my-courses
- All enrollments of the logged-in student, newest first. Each item: { enrollmentId, progress, completedCount, course: { _id, title, category, price, thumbnail, instructor { name } , lessonCount } }.
- Use populate plus ONE aggregate for lessonCount (no per-item queries).

GET /api/my-courses/:courseId
- The student's enrollment for that course plus its lessons: { course, progress, lessons: [{ _id, title, type, order, completed }] }. 404 if the student is not enrolled.

PATCH /api/my-courses/:courseId/lessons/:lessonId
- Body { completed: true|false } (must be a boolean).
- The student must be enrolled and the lesson must belong to that course.
- Use $addToSet or $pull on completedLessons, then recalculateProgress. Respond { progress, completed }.

RULES
- IDOR: every query includes student: req.user.id.
- Mount the routes in server.js.

HOW I WILL CHECK: enrol twice (second returns 409), list my courses, mark lessons complete and watch progress change, try as an instructor (403) and as a student who is not enrolled (404).
Commit: "feat(backend): enrollment and progress".
````

Check before moving on: Enroll once (second try 409); my-courses lists it; progress changes when lessons are completed.

## Prompt 6: Admin, analytics, audit log, public stats, seed

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Add admin features, public stats and the seed script. Do not touch frontend/.

PUBLIC
- GET /api/stats -> { courses, learners, instructors } (counts of courses, users with role student, users with role instructor). Used on the landing page.

ADMIN (routes/adminRoutes.js mounted at /api/admin, router.use(protect, authorize('admin')))
- GET /api/admin/users?search=&page=&limit= -> { users, page, pages, total }. Search matches name or email (escape regex).
- PATCH /api/admin/users/:id/role, body { role } in ROLES. An admin cannot change their own role (400 "You cannot change your own role."). Call logAdminAction.
- DELETE /api/admin/users/:id. An admin cannot delete themselves. If the user is an instructor who still owns courses return 400 "This instructor still has courses. Delete or reassign them first." Otherwise delete the user and their enrollments. Call logAdminAction.
- GET /api/admin/analytics -> {
    totals: { users, courses, enrollments, lessons },
    usersByRole: { admin, instructor, student },
    topCourses: [ { title, enrollments } ] (top 5 by enrollments),
    enrollmentsLast7Days: [ { date: 'YYYY-MM-DD', count } ] (always 7 entries, fill missing days with 0),
    averageProgress: number
  }
  Use Mongoose aggregate for these.
- GET /api/admin/audit-logs -> latest 20 entries with actor name, action, target and time.
- Admin course management reuses DELETE /api/courses/:id (already allows admin and logs it).

SEED SCRIPT (backend/seed.js, run with npm run seed)
- Refuse to run when NODE_ENV=production unless the flag --force is passed.
- Clear users, courses, lessons, enrollments and audit logs.
- Create: 1 admin using SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD from .env; 2 instructors; 4 students (all other passwords: "Password123").
- Create 8 realistic courses across the categories (varied prices including two free ones), each with 3 link lessons (use real public URLs such as https://react.dev/learn or https://developer.mozilla.org/).
- Create several enrollments with different progress values.
- Print a table of the demo accounts (email, password, role) at the end.

HOW I WILL CHECK: npm run seed, then in Postman log in as admin and call every admin endpoint; confirm a student and an instructor get 403.
Commit: "feat(backend): admin, analytics, audit log, seed".
````

Check before moving on: npm run seed prints demo accounts; admin endpoints work; student and instructor get 403.

## Prompt 7: Backend verification: smoke tests and Postman collection

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Verify the whole backend and fix every bug you find. Do not touch frontend/.

1. Create backend/scripts/smoke-test.js using Node's built-in fetch (no test framework). It runs against http://localhost:5000/api and prints a PASS/FAIL table. Cover:
   - register (student, instructor), duplicate email 409, role admin rejected 400, weak password 400
   - login right/wrong, NoSQL injection body {"email":{"$gt":""},"password":"x"} rejected 400
   - GET /me with and without token
   - courses: list, filter, create as instructor, create as student 403, edit own, edit another instructor's 403, delete own, invalid id 400
   - lessons: add link lesson, upload a small PDF, upload a .exe rejected 400, access as non-enrolled student 403, access as enrolled student 200, signed file URL returns the file
   - enrollment: enrol, enrol again 409, my-courses, mark lesson complete, progress updates, instructor calling /enroll 403
   - admin: analytics 200 as admin, 403 as student, change role, cannot change own role, audit log has entries
   - rate limit on /login returns 429 (run this check LAST so it does not block the others)
2. Add npm script "test:smoke": "node scripts/smoke-test.js".
3. Create a Postman collection at backend/postman/LearnHub.postman_collection.json covering EVERY endpoint, with collection variables baseUrl and token. The login request must save the token automatically in a test script. Group folders: Auth, Courses, Lessons, Enrollment, Admin.
4. Run the server and the smoke test. Fix all failures. Run npm audit and fix what can be fixed without breaking changes.
5. Check that NO response ever contains a password hash, a stack trace (set NODE_ENV=production and force an error to confirm) or a file's stored name on public routes.
6. Print the final table of results and a list of all endpoints with method, path and required role.

Commit: "test(backend): smoke tests, Postman collection, fixes".
````

Check before moving on: All smoke tests PASS. Postman collection file exists. Keep this output for your report.

## Prompt 8: Frontend foundation: Vite, theme, services, auth, routing

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Build the frontend foundation in the frontend/ folder. Do not build page designs yet; pages are simple placeholders.

1. SETUP
- Run: npm create vite@latest . -- --template react (JavaScript, not TypeScript) inside frontend/.
- Install: react-router-dom axios react-bootstrap bootstrap react-bootstrap-icons @fontsource/poppins @fontsource/manrope
- Remove Vite boilerplate (App.css, logo, demo content).
- Create frontend/.env.example with VITE_API_URL=http://localhost:5000/api and a real .env with the same value.
- Create frontend/vercel.json with a rewrite of all paths to /index.html (so React Router works after deploy).
- Put placeholder folder public/images/ (I will add hero.jpg myself).

2. FOLDERS inside src: components/common, components/layout, pages/public, pages/student, pages/instructor, pages/admin, services, routes, context, styles, utils.

3. STYLES
- styles/tokens.css: every colour, font size, spacing, radius and shadow token from AGENTS.md as CSS variables.
- styles/theme.css: global styles and Bootstrap overrides using those tokens. Import order in main.jsx: bootstrap css, @fontsource/poppins (400, 600), @fontsource/manrope (400, 600), tokens.css, theme.css.
  Theme at least: body (Manrope 16px, line-height 1.5, colour stone, background bg), headings (Poppins 600), links (walnut, underline on hover), .btn-primary (espresso fill, hover ink, active darker, disabled flat sand with stone text, 44px min height, radius 8px), .btn-outline-primary (hairline walnut border, no fill), a text-button style, .form-control and .form-select (44px, radius 8px, hairline border, visible error state with danger colour), global :focus-visible ring (2px walnut, 2px offset), .card (radius 24px, hairline border, soft shadow), .accordion, .progress (thin 8px, rounded, walnut bar on sand track), .table, .modal, .toast, .badge-less tags. Create helper classes: .text-muted-lh, .page-title, .section (consistent vertical spacing), .container-narrow (max width 1120px).

4. SERVICES (src/services)
- api.js: axios instance with baseURL = import.meta.env.VITE_API_URL. Request interceptor adds the Bearer token from localStorage key "learnhub_token". Response interceptor: on 401 from a non-auth endpoint clear the token and redirect to /login.
- One file per area with plain async functions mirroring every backend endpoint: authService, courseService, lessonService, enrollmentService, adminService.
- utils/getErrorMessage.js: turns an axios error into { message, fieldErrors } using the backend format, with friendly text when the network is down ("Cannot reach the server. Check your connection and try again.").
- utils/format.js: formatPrice (0 -> "Free", otherwise "$25"), formatDate.

5. AUTH CONTEXT (context/AuthContext.jsx)
- State: user, loading. On start, if a token exists call GET /me to restore the session; show nothing until that finishes.
- Functions: login, register, logout. Expose a useAuth hook.

6. ROUTING (routes/AppRoutes.jsx, ProtectedRoute.jsx)
- Public: / , /courses , /courses/:id , /login , /register
- Student: /dashboard/student , /dashboard/student/courses , /learn/:courseId
- Instructor: /dashboard/instructor , /dashboard/instructor/courses/new , /dashboard/instructor/courses/:id/edit
- Admin: /dashboard/admin , /dashboard/admin/users , /dashboard/admin/courses
- /dashboard redirects to the dashboard for the logged-in role. Logged-out visitors go to /login and return to the page they wanted afterwards.
- ProtectedRoute takes allowedRoles. Wrong role shows a 403 page ("You do not have access to this page") with a button to their own dashboard. Add a 404 page.
- Logged-in users who open /login or /register are redirected to their dashboard.
- Each page file is a placeholder with its name for now.
- main.jsx wraps the app in BrowserRouter and AuthProvider.

Run npm run dev and npm run build; both must pass.
Commit: "feat(frontend): foundation, theme, services, auth, routing".
````

Check before moving on: npm run dev and npm run build pass; role guards redirect correctly with placeholder pages.

## Prompt 9: Shared components and layouts

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Build the shared components and the two layouts. Follow the design system exactly. Keep everything minimal.

COMMON COMPONENTS (src/components/common)
- FormField: bold label directly above the input (4px gap), optional hint, error message under the field in danger colour that says how to fix it. Links label and input with id and aria-describedby.
- PasswordField: FormField with a show/hide toggle button (44px target, aria-label).
- EmptyState: one short heading, one sentence saying what to do next, one button.
- ErrorState: friendly message and a "Try again" button.
- LoadingState: react-bootstrap Placeholder skeletons shaped like the content (card grid, table rows, text lines). No spinner on its own for full pages.
- ConfirmModal: title, plain sentence describing the consequence, outline Cancel and a danger-filled Confirm. Confirm shows a loading state.
- StatRow and StatItem: a row of 3 figures (large Poppins number, small label) separated by hairline dividers. No coloured boxes.
- ProgressBar: thin bar with a "62%" label.
- CourseThumb: shows the thumbnail image, or when missing a placeholder in sand/caramel tints with the course's first letters in Poppins. Fixed 16:10 ratio, radius 16px inside the card.
- CourseCard: 24px radius card with 8px padding, CourseThumb, title (H3 style, max 2 lines), instructor name, category as plain text, price, and an outline "View details" button. No ratings, no hearts, no badges.
- PageHeader: page title (36px) with a one-line description and an optional action area on the right.
- Toast system: ToastContext and useToast() with success and error messages, aria-live polite, auto-hide after 5 seconds, placed bottom right.

LAYOUTS (src/components/layout)
- PublicLayout: top navbar plus Outlet plus footer.
  Navbar: wordmark "LearnHub" (Poppins 600, small espresso square with a white "L"), links Courses, then on the right "Log in" as a text link and "Sign up" as the one filled button. When logged in, show "Dashboard" and "Log out" instead. Collapses into a Bootstrap toggler on mobile. Active link is bold with a walnut underline.
  Footer: hairline top border, wordmark, three short links (Courses, Log in, Sign up) and a copyright line. Nothing else.
- DashboardLayout: left sidebar plus slim top bar plus Outlet.
  Sidebar by role. Student: Dashboard, My courses, Browse courses. Instructor: Dashboard, My courses, Create course. Admin: Overview, Users, Courses. Log out at the bottom. Active item uses a soft sand tint with bold text (not a filled button). Icons from react-bootstrap-icons at 20px centred on the text.
  Top bar: page title on the left, user name and role as plain text on the right. NO search bar, NO bell, NO avatar photo.
  Mobile (below 992px): the sidebar becomes a Bootstrap Offcanvas opened from a menu button (44px).
- Use these layouts in AppRoutes: public pages inside PublicLayout, all /dashboard and /learn pages inside DashboardLayout.

Run npm run dev and npm run build. Show me how to see each component.
Commit: "feat(frontend): shared components and layouts".
````

Check before moving on: Navbar, footer, sidebar, cards, modals and toasts render in the coffee theme.

## Prompt 10: Home (landing) page

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Build the Home (landing) page at /. Seven sections in this order. Minimal, spacious, no stock-startup look. Section spacing 96px desktop, 64px mobile.

DATA: GET /api/stats for the counts and GET /api/courses?limit=4&sort=newest for featured courses. Use useState and useEffect with loading and error states.

1. HERO (two columns, stacks on mobile)
- Left: H1 "Courses taught by people who do the work." Paragraph (max 55ch): "Browse practical courses, enroll in one click and pick up where you left off." One filled button "Browse courses" and one text link "Log in". No badge above the headline, no gradient text.
- Right: image /images/hero.jpg, radius 24px, soft shadow. If the image is missing show a sand panel with a simple inline SVG of stacked book spines in the palette.

2. SOCIAL PROOF
- One quiet row using StatRow with live numbers: courses, learners, instructors. Small caption above: "LearnHub right now". No fake testimonials, no logos.

3. PROBLEM
- H2 "Learning online gets scattered." Short paragraph: "Videos live in one tab, notes in another, and nothing tells you how far you have come." Left aligned, max 65ch.

4. SOLUTION AND FEATURED COURSES
- H2 "One place for every course." Paragraph: "LearnHub keeps your courses, lessons and progress together."
- Below it a row of up to 4 CourseCard components from the API, and an outline button "See all courses".
- Empty state if there are no courses. Skeleton while loading.

5. HOW IT WORKS
- H2 "How it works". Three steps in a row with large Poppins numerals 1, 2, 3 (walnut), a bold step title and one sentence each. No icon boxes, no cards.
  1 Browse: "Search by topic or filter by category."
  2 Enroll: "Create a free account and enroll in one click."
  3 Learn: "Open lessons, mark them done and watch your progress grow."

6. FAQ
- H2 "Questions". React Bootstrap Accordion (themed, hairline dividers), 5 items:
  Is LearnHub free? "Enrolling is free in this version. Prices are shown for reference."
  Can I teach on LearnHub? "Yes. Register as an instructor to create courses and upload lessons."
  What can I upload as a lesson? "PDF, MP4, PNG and JPG files up to 50 MB, or a link."
  How is my progress saved? "Each time you mark a lesson complete we save it to your account."
  Who can see my files? "Only enrolled students, the course instructor and admins."

7. FINAL CTA + footer
- Dark band (--lh-espresso background, sand text). H2 "Ready to start learning?" and one filled button in cream (cream background, espresso text) "Create your account". If the user is logged in, link to their dashboard instead.

RULES: no fade-in-on-scroll animation, no em dashes, no emojis, all copy exactly as given. Use Bootstrap grid. Fully responsive at 360, 768 and 1280px.
Commit: "feat(frontend): landing page".
````

Check before moving on: Add your own hero.jpg to frontend/public/images/ first. All 7 sections appear with live data.

## Prompt 11: Course listing and course detail

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Build Course Listing (/courses) and Course Detail (/courses/:id).

COURSE LISTING
- PageHeader "Courses" with one line: "Find something to learn."
- Filter bar in one row (wraps on mobile): search input (label "Search"), Category select (All plus categories from GET /api/categories), Sort select (Newest, Price low to high, Price high to low). Search runs after the user stops typing for 400 ms (debounce with useEffect and setTimeout). Keep filters in the URL query string with useSearchParams so refresh and back button work.
- Grid of CourseCard: 1 column mobile, 2 tablet, 3 desktop (4 at wide).
- Pagination at the bottom (Previous / Next with "Page 2 of 5") when more than one page.
- Loading: skeleton cards. Error: ErrorState with retry. No results: EmptyState "No courses match your search" with a button "Clear filters".
- Instructors and admins also see courses here (this is the public listing).

COURSE DETAIL
- Fetch GET /api/courses/:id and GET /api/courses/:id/lessons. 404 shows EmptyState "This course does not exist" with a button to the listing.
- Two columns on desktop. Left: CourseThumb large, H1 title, one line "By {instructor} / {category} / {n} lessons / {enrolledCount} students", then "About this course" with the description (max 65ch), then "Lessons" as a themed Accordion or simple numbered list showing lesson titles and types only.
- Right: a sticky card with the price in Poppins 24px and ONE button whose label and behaviour depend on who is looking (conditional rendering):
    logged out -> "Log in to enroll" (goes to /login and returns here)
    student, not enrolled -> "Enroll now" (POST /enroll, loading state, success toast "You are enrolled", button becomes "Continue learning")
    student, enrolled -> "Continue learning" (goes to /learn/:id)
    instructor who owns it or admin -> "Manage course" (goes to the edit page)
    other instructor -> no button, small note "Instructor accounts cannot enroll."
- Check if the student is enrolled using GET /api/my-courses.
- Enroll errors (for example already enrolled) show as an error toast with the server message.
- On mobile the card sits above the lessons.

RULES: no ratings, no wishlist heart, no cart, no "best seller" tags, no reviews.
Commit: "feat(frontend): course listing and detail".
````

Check before moving on: Filters, pagination and the enroll button states all work.

## Prompt 12: Login and Register

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Build Login (/login) and Register (/register).

LAYOUT (one shared AuthCard component used by both pages)
- A centred card (max width 960px, radius 24px, soft shadow, hairline border) split in two halves.
- Login: form on the LEFT, coffee panel on the RIGHT. Register: coffee panel on the LEFT, form on the RIGHT. The panel is --lh-espresso with sand text, a H2 and one sentence, and one OUTLINE button that switches page:
    Login panel: "New here?" / "Create an account to enroll in courses." / button "Sign up"
    Register panel: "Welcome back" / "Log in to continue your courses." / button "Log in"
- No photo, no gradient, no social login buttons, no "remember me", no "forgot password".
- Below 768px the panel becomes a short band above the form.
- Wordmark "LearnHub" links back to /.

LOGIN FORM
- Fields: Email, Password (PasswordField). One filled button "Log in" with a loading state ("Logging in...") and disabled while sending.
- Server errors: a message above the button for wrong credentials ("Invalid email or password. Check them and try again."). Field errors from the backend appear under the matching field.
- On success go to the page the user was trying to reach, otherwise to their dashboard.

REGISTER FORM
- Fields: Name, Email, Password (hint: "At least 8 characters with a letter and a number"), and "I want to" as two radio options: "Learn (student)" and "Teach (instructor)". Default student. One filled button "Create account".
- Client-side checks mirror the server: name 2+ chars, valid email, password rule. Show errors beside the field when the user leaves it (onBlur) and on submit, each saying how to fix it.
- Backend 409 (email exists) shows under Email: "An account with this email already exists. Try logging in." with a link.
- On success log the user in and send them to their dashboard with a success toast.

RULES: labels bold and close to inputs, 44px inputs and buttons, autocomplete attributes (email, current-password, new-password), focus moves to the first field with an error after a failed submit, Enter submits.
Commit: "feat(frontend): login and register".
````

Check before moving on: Errors show beside fields; login lands on the correct dashboard for each role.

## Prompt 13: Student dashboard, my courses, lesson viewer

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Build the Student pages. All inside DashboardLayout and ProtectedRoute(allowedRoles: student).

1. /dashboard/student (Dashboard)
- PageHeader "Welcome back, {first name}" with description "Pick up where you left off."
- StatRow with three figures from GET /api/my-courses: Enrolled, In progress (0 < progress < 100), Completed (progress 100).
- Section "Continue learning": a grid of up to 3 enrolled courses (card with thumb, title, ProgressBar, and ONE button "Continue" going to /learn/:courseId). Link "View all" to My courses.
- Empty state if none: "You have not enrolled in any course yet." with button "Browse courses".

2. /dashboard/student/courses (My courses)
- PageHeader "My courses". Grid of ALL enrolled courses using the same card. Tabs or two simple text filters: All, In progress, Completed. Empty state per filter.

3. /learn/:courseId (Lesson viewer)
- Fetch GET /api/my-courses/:courseId. If the student is not enrolled show EmptyState with a button to the course page.
- Header: course title, ProgressBar, small link "Back to my courses".
- Two columns (stacked on mobile). Left: lesson list (numbered, title, type as text, a check mark when completed, current lesson in bold with sand tint). Right: the viewer.
- Selecting a lesson calls GET /api/lessons/:id/access and then shows, by type:
    video -> <video controls> with the signed file URL (prefix the API origin, not the /api suffix)
    pdf -> an <iframe> (min height 70vh) with the signed URL
    image -> <img> scaled to fit with alt text from the lesson title
    link -> a short sentence and an outline button "Open link" (opens in a new tab with rel noopener)
- Under the viewer: ONE button, "Mark as complete" (becomes outline "Completed, undo" once done). It calls PATCH /api/my-courses/:courseId/lessons/:lessonId and updates progress and the check marks without reloading.
- If the signed URL expires (viewer fails to load), request a new one when the user presses "Reload lesson".
- Loading and error states for the list and for the viewer separately.

Check: after marking all lessons complete the dashboard shows the course under Completed.
Commit: "feat(frontend): student dashboard, my courses and lesson viewer".
````

Check before moving on: Enroll, open a lesson, mark complete, and see progress update.

## Prompt 14: Instructor dashboard, course form, lesson upload

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Build the Instructor pages. All inside DashboardLayout and ProtectedRoute(allowedRoles: instructor, admin).

1. /dashboard/instructor (Dashboard)
- PageHeader "Your courses" with ONE filled button "Create course" on the right.
- StatRow: Courses, Total students (sum of enrolledCount), Lessons (sum of lessonCount) from GET /api/courses/mine.
- Course grid: card with thumb, title, "{n} lessons / {n} students", and two actions: outline "Edit" and a text-style "Delete" in danger colour. Delete opens ConfirmModal: "Delete {title}? Its lessons and enrollments will be removed. This cannot be undone." On success show a toast and remove the card from the list without reloading.
- Empty state: "You have not created a course yet." with button "Create your first course".

2. /dashboard/instructor/courses/new and /edit/:id (one CourseForm component)
- Fields (bold labels, errors beside fields): Title, Category (select from /api/categories), Price (number, 0 means free, hint "Enter 0 for a free course"), Thumbnail URL (optional, hint "Paste an image link or leave empty"), Description (textarea, show a live character count out of 2000).
- ONE filled button "Create course" / "Save changes" with loading state; outline "Cancel" goes back. Backend field errors map to the matching fields.
- Edit mode pre-fills from GET /api/courses/:id. If the course is not owned by the user (and they are not admin) show the 403 page.
- After creating a course, redirect to its edit page so the instructor can add lessons straight away, with a success toast.

3. LESSONS SECTION (below the form on the edit page only)
- Heading "Lessons". List of existing lessons (order number, title, type as text, outline "Remove" with ConfirmModal).
- "Add a lesson" form: Title, then either choose a file (accepted: .pdf, .mp4, .png, .jpg; helper text "PDF, MP4, PNG or JPG, up to 50 MB") or paste a link. Check size and type on the client before sending, with clear messages. Send multipart/form-data with FormData through Axios and show a real upload progress bar using onUploadProgress. Button "Add lesson" (filled only if it is the section's single primary action) with loading state. The list refreshes after upload.
- Empty state: "No lessons yet. Add your first lesson below."

RULES: admins who open these pages see the same UI. Keep spacing on the 4px grid and one filled button per section.
Commit: "feat(frontend): instructor dashboard, course form and lesson upload".
````

Check before moving on: Create a course, upload a lesson with a progress bar, edit and delete.

## Prompt 15: Admin overview, users, courses

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Build the Admin pages. All inside DashboardLayout and ProtectedRoute(allowedRoles: admin).

1. /dashboard/admin (Overview with analytics)
- PageHeader "Overview".
- StatRow: Users, Courses, Enrollments (from GET /api/admin/analytics totals). Under it a small plain-text line "Lessons: n / Average progress: n%".
- "Users by role": three horizontal bars (admin, instructor, student) built with plain divs and CSS widths in walnut on a sand track, with the number at the end. No chart library.
- "Top courses": up to 5 rows with course title and a bar scaled to enrollments.
- "Enrollments in the last 7 days": 7 simple vertical bars with the weekday under each and the count above. Plain CSS, soft walnut colour, accessible text alternative (a visually hidden table or aria-label).
- "Recent admin activity": a table of the latest 10 audit entries (who, what, when). Empty state: "No admin activity yet."

2. /dashboard/admin/users
- PageHeader "Users" with a search field (debounced).
- Table (responsive, scrolls inside its own container on mobile): Name, Email, Role (a select that changes the role immediately with a confirm toast; disabled for the logged-in admin), Joined, and a text "Delete" in danger colour opening ConfirmModal.
- Server messages (for example instructor still owns courses) show in an error toast.
- Pagination Previous / Next.

3. /dashboard/admin/courses
- PageHeader "Courses". Table: Title, Instructor, Category, Price, Students, and actions "View" (to the detail page) and "Delete" with ConfirmModal. Uses GET /api/courses with limit=50 plus page controls.

RULES: no filled button except where a section truly needs one, hairline row dividers, row height at least 48px, tap targets 44px, empty and error states everywhere.
Commit: "feat(frontend): admin overview, users and courses".
````

Check before moving on: Analytics show real data; changing a role writes to the audit table.

## Prompt 16: Polish and audit pass

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Do a full polish and audit pass of the frontend. Fix everything you find, then give me a short report of what you changed.

FUNCTION
- Walk through every flow as each role and fix bugs: register, login, logout, session restore after refresh, course list filters, course detail buttons for every user type, enroll, lesson viewer, mark complete, create/edit/delete course, add/remove lesson, admin role change and delete.
- Role guards: manually confirm a student opening /dashboard/admin sees the 403 page, a logged-out visitor opening /dashboard/student goes to /login, and a logged-in user opening /login is redirected away.
- Every request must have a loading state, an error state with retry and, for lists, an empty state that says what to do next. Every failed form submit shows an understandable message beside the field or at the top of the form.
- Set document.title per page (for example "Courses | LearnHub").
- Remove console.log, unused files, unused imports and unused dependencies.

DESIGN AUDIT (check against AGENTS.md and fix)
- Spacing only from the 4px scale; consistent section spacing.
- Body text at least 16px; paragraph line length 60-75 characters; line-height about 1.5.
- Contrast 4.5:1 for all text. Confirm --lh-caramel is not used as text on light backgrounds.
- Inner radius rule on cards, inputs, buttons, images.
- One filled button per section; everything else outline or text.
- Hairline borders, soft shadows, no heavy grey borders.
- Tap targets 44px; visible focus ring on every interactive element; hover = darker solid colour, never fading; distinct disabled and loading states.
- Icons centred on text height; no emoji; no em dashes; no cliche patterns from the AGENTS.md list; no default unthemed Bootstrap look anywhere.
- Images have alt text, inputs have labels, buttons without text have aria-label, keyboard-only navigation works everywhere including modals, accordion and offcanvas.
- Responsive check at 360px, 768px and 1280px: no horizontal page scroll (tables scroll inside their container).

Run npm run build and fix all warnings. Run npm audit and fix what can be fixed safely.
Commit: "chore(frontend): polish, accessibility and design audit".
````

Check before moving on: Build has no warnings; every state looks right on phone, tablet and desktop.

## Prompt 17: Deployment preparation and README

````
NOTE FOR THIS TASK: The current directory is the project root (it is already named learnhub). Do NOT create another learnhub folder; wherever this prompt says learnhub/ it means the current directory. On this Windows machine PowerShell blocks npm.ps1, so run npm as npm.cmd (and npx as npx.cmd). Never read, print or edit backend/.env or frontend/.env unless I ask. Do not start long-running servers yourself; tell me the command and I will run it in another terminal.

Read AGENTS.md first. Prepare the whole project for deployment and documentation.

BACKEND (Render)
- Confirm: "start" script is node server.js; PORT comes from env; trust proxy is on; CORS accepts the exact Vercel URL from CLIENT_URL (comma-separated list supported); NODE_ENV=production hides stack traces; the uploads folder is created automatically if missing.
- Add a clear note in the README: Render's free tier has an ephemeral disk, so uploaded files can disappear after a redeploy or restart. Link lessons are not affected.
- List every environment variable Render needs.

FRONTEND (Vercel)
- Confirm vercel.json rewrites exist, VITE_API_URL is read from env, and npm run build succeeds. Test the production build with npm run preview against the local backend.

SECURITY FINAL CHECK
- Run npm audit in both folders and fix what can be fixed. Search the repo to confirm no secrets are committed (look for "mongodb+srv", "JWT_SECRET=" with a real value, and .env files). Confirm .env is ignored by git.

README.md at the repository root with these sections:
1. LearnHub: one paragraph overview and a screenshots placeholder section.
2. Features by role (Admin, Instructor, Student) and for visitors.
3. Technologies used (React, Vite, React Router, Axios, React Bootstrap, Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcryptjs, Multer, Helmet, express-validator, express-rate-limit).
4. Project structure (tree).
5. Installation steps: prerequisites, clone, backend setup (npm install, copy .env.example to .env, fill values), npm run seed, npm run dev, frontend setup (npm install, .env, npm run dev), URLs.
6. Demo accounts from the seed script (admin, instructor, student).
7. API reference table (method, path, role, description).
8. Security measures implemented (one line each).
9. Deployment steps for Render and Vercel with the exact settings (root directory, build command, start command, env variables).
10. Known limitations (no payments, ephemeral uploads on free hosting).
11. Author section with placeholders for name and batch.

Commit: "docs: README and deployment preparation". Then show me git log --oneline.
````

Check before moving on: README is complete; no secrets in git; production build runs.

