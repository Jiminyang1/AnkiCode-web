# AnkiCode – Spaced-Repetition LeetCode Coach

AnkiCode is a MERN (MongoDB, Express, React, Node.js) prototype that helps learners drill LeetCode questions using spaced repetition and note-backed review. The project contains a React/Vite front-end, an Express/MongoDB API, and a small json-server dataset for historical reference.

## Features

- Email+password login with JWT session persistence
- Dashboard that prioritises today’s review queue, quick stats, and full problem library
- Mark-as-reviewed / skip-till-tomorrow spaced-repetition actions
- LeetCode integration for searching problems and importing descriptions before scheduling first review
- Rich problem detail page for editing notes or deleting a drill (notes cascade delete)

## Tech Stack

- **Client:** React 19 + Vite + TypeScript, React Router, Axios, custom CSS
- **Server:** Node.js + Express, MongoDB via Mongoose, JWT authentication
- **External services:** Alfa LeetCode API for search and problem metadata ([repo](https://github.com/alfaarghya/alfa-leetcode-api))

## Getting Started

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd project

npm install --prefix server
npm install --prefix client
```

### 2. Configure environment variables

Create `server/.env` based on:

```
MONGODB_URI=your-mongodb-connection-string
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=generate-a-long-random-string
```

Create `client/.env` (or `.env.local`):

```
VITE_API_BASE_URL=http://localhost:4000/api
```

### 3. Seed demo data (optional but recommended)

```bash
MONGODB_URI="<your connection string>" npm run --prefix server seed
```

This bootstraps the demo user `demo@ankicode.dev / ankicode` plus starter problems.

### 4. Run the stack

```bash
npm run --prefix server dev   # starts Express API on port 4000
npm run --prefix client dev   # launches Vite dev server on port 5173
```

Visit `http://localhost:5173` and login with the demo credentials.

## Project Structure

```
project/
├── client/            # React front-end
│   ├── src/pages/     # Login, Dashboard, AddProblem, ProblemDetail
│   ├── src/context/   # AuthProvider (JWT persistence)
│   └── src/api/       # Axios client + LeetCode integration
├── server/            # Express API
│   ├── src/models/    # Mongoose schemas (User, Problem, ProblemDetail)
│   ├── src/controllers/# Auth, problem, problemDetail handlers
│   ├── src/routes/    # REST routes, JWT middleware
│   └── src/seed.js    # Demo data seeder
└── mock/db.json       # Legacy json-server dataset (no longer used in MERN flow)
```

## API Overview

| Method | Endpoint                  | Description                              |
| ------ | ------------------------- | ---------------------------------------- |
| POST   | `/api/auth/login`         | Authenticate and receive JWT token       |
| GET    | `/api/auth/me`            | Return current user from bearer token    |
| GET    | `/api/problems`           | List problems for logged-in user         |
| POST   | `/api/problems`           | Create new problem (rejects duplicates)  |
| PATCH  | `/api/problems/:id`       | Update spaced-repetition metadata        |
| DELETE | `/api/problems/:id`       | Delete problem + cascading notes         |
| POST   | `/api/problemDetails`     | Add a note to a problem                  |
| PATCH  | `/api/problemDetails/:id` | Update existing note                     |
| DELETE | `/api/problemDetails/:id` | Remove note                              |

All non-auth routes require a `Bearer <token>` header.

## Front-end Highlights

- Dashboard hero + stat cards summarise queue health
- Review queue cards provide quick-note preview, next/last review dates, and actions
- Library table lets you jump into full notes for any stored drill
- Add Problem flow does fuzzy search via Alfa LeetCode API, previews problem statement, and records first review

## Scripts

```bash
# server/
npm run dev      # nodemon dev server
npm run seed     # seed demo user + problems
npm run start    # production start (node)

# client/
npm run dev      # Vite dev server
npm run build    # bundle front-end
npm run preview  # preview production build
npm run lint     # eslint check
```

## Testing & Future Work

- Expanded metrics (streaks, retention scores, AI coaching suggestions)
- Collaborative study groups or shared decks
- Offline-first caching of LeetCode metadata
- Automated tests (unit/integration) for API + UI flows

## Credits

- LeetCode problem data provided by [alfa-leetcode-api](https://github.com/alfaarghya/alfa-leetcode-api)
- Designed and implemented as part of CS409 “AnkiCode” course project

