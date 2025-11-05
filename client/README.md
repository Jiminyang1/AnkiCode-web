# AnkiCode Frontend

React + TypeScript prototype for the AnkiCode spaced-repetition LeetCode coach. The UI is built with Vite, React Router, Axios, and handcrafted CSS. A Node/Express API backed by MongoDB serves the application data.

## Requirements

- Node.js 20+
- npm 10+

## Quick Start

Install dependencies once:

```bash
npm install
```

### 1. Start the backend API

In the project root:

```bash
npm install --prefix ../server
MONGODB_URI="<your connection string>" npm run --prefix ../server dev
```

The API listens on `http://localhost:4000` by default. You can override the base URL in the frontend via `VITE_API_BASE_URL`.

### 2. Start the Vite dev server

In another terminal from `client/`:

```bash
npm run dev
```

Open the printed URL (defaults to `http://localhost:5173`).

## Demo Credentials

- Email: `demo@ankicode.dev`
- Password: `ankicode`

Seed the backend once with:

```bash
MONGODB_URI="<your connection string>" npm run --prefix ../server seed
```

This provisions the demo account plus two starter problems in MongoDB.

## Project Structure

- `src/pages/LoginPage.tsx` – simple email-based login that calls the Express API.
- `src/pages/DashboardPage.tsx` – highlights today’s reviews with mark/skip actions, lists all problems, and links out to other views.
- `src/pages/AddProblemPage.tsx` – integrates the Alfa LeetCode API to search problems, capture notes, and schedule their first review.
- `src/pages/ProblemDetailPage.tsx` – shows per-problem metadata, supports editing notes, and allows deleting a problem (with its notes).
- `src/components/NavBar.tsx` – top-level navigation with logout.
- `src/context/AuthContext.tsx` – in-memory authentication state shared across routes.
- `../server` – Express + MongoDB backend providing authentication, problem CRUD, and spaced-repetition endpoints.

## Next Steps

- Add authentication guardrails (JWT/session) once the backend hardens beyond the MVP.
- Expand the dashboard to surface AI coaching insights, streaks, and spaced-repetition intervals.
- Implement collaborative or multi-user features atop the MongoDB models.
