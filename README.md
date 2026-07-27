# SCC Chess Club

The official web platform for the **Saint Columban College Chess Club**, built to run the club's ladder, tournaments, casual online play, and officer roster in one place.

Maintained for the SCC Chess Club under the leadership of **Mr. Ralph Yañez**, President, A.Y. 2026–2027.

---

## Overview

This app replaces ad-hoc spreadsheets and group-chat pairings with a single system that handles:

- **Admin access** — no member accounts. Admins/superadmins sign in with their institutional Google account; a superadmin manages who has access.
- **Ladder rankings** — an Elo-based rating that updates automatically as results are recorded.
- **Tournaments** — admin-run Swiss or round-robin events with generated pairings per round, plus bulk player import (paste names from Sheets/Excel) and CSV export.
- **Casual play** — a real-time, shareable-room chess board for two players (or spectators), no account required.
- **Announcements & officer roster** — a dynamic "About" page and homepage announcements that admins manage without touching code.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Actions, Server Components) |
| UI | React 19, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com) primitives, Lucide icons |
| Database | A Google Sheet, accessed via the Sheets API with a service account (`src/lib/sheets`) |
| Auth | [Auth.js](https://authjs.dev) (NextAuth v5) with the Google provider, restricted to emails listed in the sheet's `Admins` tab |
| Realtime play | [Firebase Realtime Database](https://firebase.google.com/docs/database), anonymous room codes — no accounts |
| Chess logic | [`chess.js`](https://github.com/jhlywa/chess.js) for rules/move validation, [`react-chessboard`](https://github.com/Clariity/react-chessboard) v5 for the board UI |
| Testing | [Vitest](https://vitest.dev) |
| Language | TypeScript throughout |

## Architecture

### Routing (`src/app`)

```
/                        Landing page + latest announcements
/about                   Club info + dynamic officer roster
/schedule                Club meeting schedule
/ladder                  Public Elo ladder standings (+ CSV export)
/tournaments             List of tournaments
/tournaments/[id]        Tournament detail — rounds, pairings, results (+ CSV export)
/play                     Casual play lobby (create/join a room, no login)
/play/[roomCode]          Live two-player board with realtime sync via Firebase
/login                    Admin Google sign-in
/admin                    Admin dashboard — create/manage tournament events
/admin/events/[id]        Round generation, pairing results, ladder updates
/admin/officers           Officer roster CRUD (name, role, photo URL)
/admin/announcements      Post/remove homepage announcements
/admin/admins             Superadmin-only — add/remove admins by email
```

Server Actions live in `src/app/actions/` and are the only write path into the data layer — no client-side writes to the sheet.

### Data layer (`src/lib/sheets`)

The Google Sheet acts as the database, with one tab per entity:

- `Admins` — email, role (`superadmin` | `admin`). Controls both sign-in and access level.
- `Announcements`, `Officers` — homepage/about-page content.
- `Events`, `Registrations`, `Rounds`, `Pairings` — tournament data.
- `Players`, `LadderHistory` — persistent Elo ratings and rating-change log, keyed by player name (there are no member accounts, so a player is just a name an admin registers into an event).

`src/lib/sheets/client.ts` wraps the raw Sheets API (read/append/update/overwrite a tab). `src/lib/sheets/data.ts` builds typed query/mutation functions on top of it — this is what pages and Server Actions call. `scripts/seed-sheets.ts` creates the tabs with headers and seeds the first superadmin.

### Auth (`src/lib/auth.ts`)

NextAuth with the Google provider. On sign-in and on every JWT refresh, the signed-in email is checked against the `Admins` tab; unlisted emails are rejected. `src/proxy.ts` (Next.js's renamed `middleware` convention) gates all `/admin/*` routes.

### Realtime play (`src/lib/firebase`, `src/components/chess`)

- `local-board.tsx` — single-device board for practice/analysis.
- `room-controls.tsx` / `play/[roomCode]/page.tsx` — creates/joins a Firebase Realtime Database room keyed by a random room code; a per-browser random client ID (stored in `localStorage`) claims the white/black slot, so no login is needed.
- `online-board.tsx` — board synced by listening to the room's `fen` value in Firebase.
- `board-highlights.ts` — shared square-highlighting logic (legal moves, last move, check).

### Ladder & pairing logic (`src/lib`)

- `elo.ts` — Elo rating update on decisive/drawn results.
- `pairing/swiss.ts` — Swiss-system pairing generation.
- `pairing/roundRobin.ts` — round-robin schedule generation.
- `pairing/standings.ts` — score computation across rounds.

## Getting started

### Prerequisites

- Node.js 20+
- A Google Cloud project with the Sheets API enabled, a service account, and an OAuth client (Web application)
- A Google Sheet shared with the service account as Editor
- A Firebase project with Realtime Database enabled

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in every value in `.env.local` — see the file for the full list (Google Sheets service account credentials, the target spreadsheet ID, Google OAuth client ID/secret, an `AUTH_SECRET`, and the Firebase web config). None of these are committed; `.env.local` is gitignored.

### 3. Seed the spreadsheet

Creates the required tabs with headers and adds your email as the first superadmin:

```bash
npm run seed:sheets -- you@example.com
```

### 4. Set Firebase Realtime Database rules

In the Firebase console, under **Realtime Database → Rules**, allow open access under `rooms` (casual play has no accounts, and room data isn't sensitive):

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 5. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Other scripts

```bash
npm run build          # production build
npm run start           # run the production build
npm run lint            # ESLint
npm run test             # Vitest
npm run seed:sheets     # (re)initialize sheet tabs / add an admin
```

## Admin access

There's no self-serve sign-up. A superadmin adds an admin's institutional email at `/admin/admins` (or directly in the `Admins` tab of the sheet); that person can then sign in at `/login` with Google. The first superadmin is set via `npm run seed:sheets -- you@example.com`.

## Deployment

The app is a standard Next.js App Router project and deploys cleanly to [Vercel](https://vercel.com). Add every variable from `.env.local` to the project's Environment Variables (Production and Preview) before deploying — the app throws on `/admin` routes if the Google Sheets or Auth env vars are missing. Also add the deployed origin's callback URL (`https://<your-domain>/api/auth/callback/google`) to the OAuth client's Authorized redirect URIs in Google Cloud Console.

## License

MIT — see [`LICENSE`](./LICENSE).

---

Built for the Saint Columban College Chess Club, A.Y. 2026–2027.
