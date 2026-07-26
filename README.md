# SCC Chess Club

The official web platform for the **Saint Columban College Chess Club**, built to run the club's ladder, tournaments, casual online play, and officer roster in one place.

Maintained for the SCC Chess Club under the leadership of **Mr. Ralph Yañez**, President, A.Y. 2026–2027.

---

## Overview

This app replaces ad-hoc spreadsheets and group-chat pairings with a single system that handles:

- **Membership & auth** — email/password sign-up with Supabase-verified email confirmation.
- **Ladder rankings** — an Elo-based rating that updates automatically as results are recorded.
- **Tournaments** — admin-run Swiss or round-robin events with generated pairings per round.
- **Casual play** — a real-time, shareable-room chess board for two players (or spectators) with no tournament context required.
- **Officer roster** — a dynamic, photo-backed "About" page that admins manage without touching code.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Server Actions, Server Components) |
| UI | React 19, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com) primitives, Lucide icons |
| Backend / DB | [Supabase](https://supabase.com) — Postgres, Auth, Row Level Security, Realtime, Storage |
| Chess logic | [`chess.js`](https://github.com/jhlywa/chess.js) for rules/move validation, [`react-chessboard`](https://github.com/Clariity/react-chessboard) v5 for the board UI |
| Testing | [Vitest](https://vitest.dev) |
| Language | TypeScript throughout |

## Architecture

### Routing (`src/app`)

```
/                    Landing page
/about               Club info + dynamic officer roster
/join                Membership info / how to join
/schedule            Club meeting schedule
/ladder              Public Elo ladder standings
/tournaments          List of tournaments
/tournaments/[id]     Tournament detail — rounds, pairings, results
/play                 Casual play lobby (create/join a room)
/play/[roomCode]      Live two-player board with realtime sync
/login, /signup       Auth forms
/auth/callback        Supabase email-confirmation redirect handler
/admin                 Admin dashboard — create/manage tournament events
/admin/events/[id]     Round generation, pairing results, ladder updates
/admin/officers        Officer roster CRUD (name, role, 1:1 photo)
```

Server Actions live in `src/app/actions/` (`auth.ts`, `tournaments.ts`, `officers.ts`) and are the only write path into Supabase — no client-side service-role calls.

### Data layer (`supabase/migrations`)

Postgres schema, applied as sequential SQL migrations:

- `0001_init.sql` — `profiles`, `events`, `event_registrations`, `rounds`, `pairings`, `ladder_history`, `game_rooms`, plus a trigger that auto-creates a `profiles` row on signup and an `is_admin()` helper used across Row Level Security policies.
- `0002_officers.sql` — `officers` table (role, name, photo URL, display order) and a public `officer-photos` Storage bucket, both gated so only admins can write while everyone can read.

Every table has RLS enabled: public read for club-facing data (ladder, events, officers), admin-only writes enforced at the database level — not just in the UI.

`src/lib/supabase/types.ts` is a hand-written mirror of the schema for full type safety in queries; regenerate it with the Supabase CLI once a project is linked:

```bash
npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
```

### Chess engine integration (`src/components/chess`)

- `local-board.tsx` — single-device board for practice/analysis.
- `online-board.tsx` — realtime board synced via Supabase Broadcast channels, with room state persisted to `game_rooms.fen`.
- `board-highlights.ts` — shared square-highlighting logic: legal-move dots (capture vs. quiet move styled differently), last-move highlight, and a red highlight on the king's square when in check. Both boards support click-to-select-then-move in addition to drag-and-drop.

### Ladder & pairing logic (`src/lib`)

- `elo.ts` — Elo rating update on decisive/drawn results.
- `pairing/swiss.ts` — Swiss-system pairing generation.
- `pairing/roundRobin.ts` — round-robin schedule generation.
- `pairing/standings.ts` — score computation across rounds.

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project (Postgres + Auth + Storage enabled)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your Supabase project's credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` must match a domain in the deployment environment — see [Email confirmation setup](#email-confirmation-setup) below.

### 3. Apply database migrations

Run the SQL files in `supabase/migrations/` against your Supabase project, in order, via the SQL editor in the Supabase dashboard or:

```bash
supabase db push
```

### 4. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Other scripts

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # ESLint
npm run test    # Vitest
```

## Email confirmation setup

Supabase only redirects confirmation-link clicks to URLs on its own allow-list, regardless of what the app requests. For sign-up confirmation to actually complete:

1. In the Supabase dashboard, go to **Authentication → URL Configuration**.
2. Set **Site URL** to your deployed origin (e.g. `https://your-domain.com`).
3. Add both of the following to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (local development)
   - `https://your-domain.com/auth/callback` (production)
4. Make sure `NEXT_PUBLIC_SITE_URL` in your environment matches the production origin exactly.

Without step 3, the confirmation email is sent and clickable, but the redirect lands outside the app and the session is never established.

## Admin access

There is no separate "become an admin" flow by design — an operator promotes a member directly in the database:

```sql
update profiles set role = 'admin' where email = 'someone@example.com';
```

Admins can then reach `/admin` to manage tournaments and `/admin/officers` to manage the roster shown on `/about`.

## Deployment

The app is a standard Next.js App Router project and deploys cleanly to [Vercel](https://vercel.com). Set the same three environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`) in the project's production environment before the first deploy.

## License

MIT — see [`LICENSE`](./LICENSE).

---

Built for the Saint Columban College Chess Club, A.Y. 2026–2027.
