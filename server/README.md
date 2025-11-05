# AnkiCode API

Express + MongoDB backend for the AnkiCode MERN prototype. Provides authentication, problem management, spaced-repetition actions, and note storage.

## Requirements

- Node.js 20+
- npm 10+
- MongoDB Atlas connection string (or local Mongo instance)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file (see `.env.example` for values) and set:

   ```env
   MONGODB_URI=your-mongodb-connection-string
   PORT=4000
   CLIENT_ORIGIN=http://localhost:5173
   JWT_SECRET=some-long-random-string
   ```

3. Seed the demo data (optional but recommended for the prototype):

   ```bash
   npm run seed
   ```

4. Start the API server:

   ```bash
   npm run dev
   ```

The server exposes REST endpoints under `/api`.

## Available Endpoints

| Method | Endpoint                  | Description                                  |
| ------ | ------------------------- | -------------------------------------------- |
| POST   | `/api/auth/login`         | Authenticate with email & password           |
| GET    | `/api/auth/me`            | Return the current user (requires JWT)       |
| GET    | `/api/problems`           | List problems for the authenticated user     |
| GET    | `/api/problems/:problemId`| Fetch a single problem with notes            |
| POST   | `/api/problems`           | Create a new problem (rejects duplicates)    |
| PATCH  | `/api/problems/:problemId`| Update spaced-repetition metadata            |
| DELETE | `/api/problems/:problemId`| Delete a problem and cascade its notes       |
| POST   | `/api/problemDetails`     | Add notes for a problem                      |
| PATCH  | `/api/problemDetails/:detailId` | Update stored notes                    |
| DELETE | `/api/problemDetails/:detailId`| Remove a note entry                     |

All problem routes require a `Bearer <token>` header issued by the login endpoint.

## Authentication

- Login returns a JWT valid for 7 days. Store it client-side and send it via `Authorization: Bearer ...`.
- Hitting `/api/auth/me` with the token allows the client to restore a session after refresh.
- Use the seed script to create the demo credentials (`demo@ankicode.dev` / `ankicode`).

## Development Tips

- Update `CLIENT_ORIGIN` if you host the frontend elsewhere.
- Use `npm run dev` during development for automatic reloads via nodemon.
- The Alfa LeetCode API is consumed directly from the frontend for search/preview. Backend focuses on persistence and spaced-repetition state.

