# LearnHub project rules (read before every task)
## What this is
LearnHub is a MERN stack Learning Management System. It is a WEBSITE (not a mobile app) for a
university final project. Roles: admin, instructor, student.
It must be FUNCTIONAL and stay inside what a standard MERN course teaches: React (components,
props, useState, useEffect, lists, conditional rendering, React Router), Axios, React
Bootstrap, Node/Express, MongoDB/Mongoose, JWT, bcrypt, .env files.
Do NOT add TypeScript, Redux, Next.js, GraphQL, Docker, Tailwind, shadcn or test frameworks.
The student must explain every file in a viva, so keep code simple, readable and commented.
## Code style
- Plain JavaScript. Backend uses CommonJS (require). Frontend uses ES modules, function
 components and hooks.
- Add a short comment explaining WHY on every controller, middleware and non-trivial
 component.
- Small files, one job each. Descriptive names. No clever one-liners.
- Never hard-code secrets. All config comes from .env. Keep .env.example up to date.
- After every task: run the code, fix errors, then tell me what command to run and what I
 should see.
## Layout
learnhub/
 backend/ config, models, controllers, routes, middleware, utils, uploads, server.js
 frontend/ src/components, src/pages, src/services, src/routes, src/context, src/styles,
 src/utils
## API conventions
- Every route lives under /api and returns JSON.
- Errors: { "message": "plain English sentence" } and, for validation, also "errors": {
 "fieldName": "how to fix it" }.
- Status codes: 200, 201, 400, 401, 403, 404, 409, 429, 500.
## Security rules (apply to EVERY route you write)
- Auth on every route except: GET /api/health, GET /api/stats, GET /api/categories, GET
 /api/courses, GET /api/courses/:id, GET /api/courses/:courseId/lessons, POST /api/register,
 POST /api/login, GET /api/files/:token.
- Never trust the frontend. Validate and sanitize every body, param and query on the server
 (express-validator). Whitelist fields by name. NEVER pass req.body straight into
 Model.create or update.
- Stop IDOR: always check ownership. An instructor may only change their own courses and
 lessons. A student may only read their own enrollments. Admin may do everything. Take the
 user id from the JWT (req.user), never from the request body.
- Role is never set from the client except the register form, which may only choose student or
 instructor. Admin accounts come from the seed script.
- Block NoSQL injection: express-mongo-sanitize, type checks on inputs, validate ObjectIds
 before queries.
- Passwords: bcrypt hash, never returned in any response, never logged. Login errors are
 generic ("Invalid email or password").
- Helmet security headers, CORS locked to CLIENT_URL, rate limits (strict on login and
LearnHub: OpenCode prompt pack Page 4
 register).
- Uploads: allow only PDF, MP4, PNG, JPG, max 50 MB, random file names, stored outside any
 public static folder, served only through an authorised route.
- Production: no stack traces or internal error text in responses. Log admin actions to the
 AuditLog collection.
- Run npm audit before finishing a phase.
## Design system (apply to EVERY screen)
Minimalist and calm. Fewer elements, more space. If an element does not help the user finish a
task, remove it.
Colour tokens (CSS variables in src/styles/tokens.css):
 --lh-ink #1A120E darkest text, dark bands
 --lh-espresso #3A2418 primary filled buttons, headings
 --lh-walnut #6B4A2E links, focus ring, secondary text on light
 --lh-caramel #A88462 DECORATIVE ONLY (dividers, icons on dark). Never text on a light
 background (contrast 3.4:1)
 --lh-sand #D5C4AE soft surfaces, placeholders, text on dark
 --lh-stone #4A4A46 body text, muted labels
 --lh-bg #FBF8F3 page background (warm off-white)
 --lh-surface #FFFFFF cards, inputs
 --lh-line rgba(58,36,24,0.12) hairline borders (1px)
 --lh-success #2F6B3F --lh-danger #A63A2B
 Light theme only. Keep all colours in variables so dark mode could be added later by lifting
 surfaces, not inverting.
Typography (self-hosted with @fontsource):
 Poppins for headings: page title 36px/600, H1 24px/600, H2 22px/600, H3 20px/600, sub-head
 18px and 16px/600.
 Manrope for body: 16px regular minimum, line-height 1.5, captions 14px (metadata only).
 Headings line-height 1.25. Paragraph max width 65ch. Bold the label, not everything.
Spacing and shape:
 - Everything on a 4px grid: 4, 8, 12, 16, 24, 32, 48, 64, 96.
 - Group by proximity: label 4px above its input, field-to-field 16px, section-to-section
 64px (mobile) or 96px (desktop).
 - Inner radius = outer radius minus padding. Cards: radius 24px with 16px padding, so inner
 buttons, inputs and tags use 8px. Image inside a card with 8px padding uses 16px.
 - Soft shadows only: 0 8px 32px rgba(26,18,14,0.06). Hairline 1px borders, never heavy grey
 borders.
 - One filled button per section. Others are outline or text links.
 - Tap targets at least 44px high and wide.
 - Contrast at least 4.5:1 for text.
States: every interactive element needs distinct default, hover, focus-visible, active,
disabled and loading looks.
 - Focus ring always visible: 2px solid --lh-walnut with 2px offset.
 - Hover = change to a darker SOLID colour. Never fade opacity.
 - Errors appear beside or under the field and say how to fix it ("Use at least 8
 characters").
 - Empty states say what to do next and give one button.
 - Icons: react-bootstrap-icons, used sparingly (navigation, actions). Centre them on the
 text height (inline-flex, align-items center, gap 8px). Decorative icons get aria-hidden.
Avoid these AI-looking cliches:
 no purple-to-blue gradients; no gradient hero text; no emojis in headings; do not default to
 Inter; no coloured-border cards; no glassmorphism; no low-contrast dark mode; no row of
 three icon boxes; no pill or badge above the headline; do not overuse icons; no unstyled
 default Bootstrap look (every component must be themed); no fade-in-on-scroll animations; no
 cursor effects; no fading buttons on hover; no inconsistent spacing; avoid em dashes; no
 marketing buzzwords (no "revolutionise", "unlock", "seamless", "empower"); no serif italic
 accents; no grain or noise textures.
