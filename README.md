# LearnHub

LearnHub is a Learning Management System built with the MERN stack (MongoDB, Express, React,
Node.js) for a university final project. It is a website for three roles: admin, instructor
and student.

This repository currently contains the project skeleton only. Application code is added in
later tasks.

## Project structure

```
learnhub/
  AGENTS.md              project rules, read before every task
  backend/
    config/              database and app configuration
    controllers/         request handlers
    middleware/          auth, validation, error handling
    models/              Mongoose schemas
    routes/              Express route definitions
    utils/               small shared helpers
    uploads/             uploaded files, served only through authorised routes
    server.js            (added later) Express entry point
  frontend/
    public/              static files
    src/
      components/        reusable UI components
      context/           React context providers
      pages/             route level pages
      routes/            React Router setup
      services/          Axios API calls
      styles/            tokens and global styles
      utils/             small frontend helpers
```

## Stack

- Backend: Node.js, Express, MongoDB with Mongoose, JWT, bcrypt, express-validator
- Frontend: React with Vite, React Router, Axios, React Bootstrap, react-bootstrap-icons
- Fonts: Poppins and Manrope, self hosted with @fontsource

TypeScript, Redux, Next.js, GraphQL, Docker, Tailwind, shadcn and test frameworks are
deliberately not used. See `AGENTS.md` for the full set of rules, including the API, security
and design conventions.

## Setup

Setup commands are added with the first code task. The intended steps will be:

1. Install backend dependencies and create `backend/.env` from `backend/.env.example`.
2. Install frontend dependencies.
3. Start MongoDB, then run the backend and frontend development servers.

## Notes

- Environment files are ignored by git. Only `.env.example` is committed.
- Files placed in `backend/uploads/` are ignored by git. The folder itself is kept with
  `.gitkeep`.
