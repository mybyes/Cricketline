# CricketFast (Cricketline)

**Live cricket scores, ball-by-ball, scorecards & fixtures** — fast, free, and fully usable
without an account. A monorepo with one backend feeding a web portal and an Android/iOS app.

```
            ┌──────────────┐   SSE + REST    ┌────────────────────┐
 CricAPI ──▶│  Fastify API │ ───────────────▶│  Next.js web (SEO) │
 (+ seed    │  + Upstash   │                 ├────────────────────┤
  fallback) │  Redis cache │ ───────────────▶│  Expo app (live    │
            └──────────────┘   SSE + REST    │  line)             │
                                             └────────────────────┘
```

| App | Purpose | Dev command |
|-----|---------|-------------|
| `apps/backend` | Fastify API — CricAPI + Redis cache + SSE + auth | `pnpm dev:backend` (`:3000`) |
| `apps/web` | Next.js 15 SSR portal (discovery / SEO) | `pnpm dev:web` (`:3001`) |
| `apps/mobile` | Expo (Android/iOS) live-line app | `pnpm dev:mobile` |

---

## Quick start

Requires **Node 22+** and **pnpm 11**.

```bash
pnpm install
pnpm dev:backend     # API on :3000  (runs in demo/seed mode out of the box — no keys needed)
pnpm dev:web         # portal on :3001
pnpm dev:mobile      # Expo — press w for browser, a for Android, or scan the QR
```

That's it — with **zero configuration** the whole stack runs on a built-in demo dataset. The
clients default to `http://localhost:3000` in dev, so nothing else to wire up.

---

## How the data works (demo → live)

The backend has **one rule: never show a blank app.** Each request resolves in this order:

```
live CricAPI  →  fresh Redis cache  →  7-day real backup  →  pre-filled set (last resort)
```

- **Demo (default):** no key set (or `SEED_DATA=1`) → serves the built-in dataset everywhere
  (lists *and* match detail), so you can develop and demo with no API key.
- **Live:** set a **free** CricAPI key and the app serves real scores. Real data — even stale
  cache — is always preferred; the pre-filled set only appears on a genuine cold-start failure
  (no key / all keys over quota / API down before the cache warmed) and is flagged `stale:true`.

### Going live (free tier)
1. Create a free key at **cricketdata.org** (pool several as `CRICAPI_KEYS=k1,k2,k3` to multiply
   the daily quota — the backend auto-rotates when one is exhausted).
2. Set it on the backend and **remove `SEED_DATA`** (or set `0`).
3. `GET /health` should report `"mode":"live"`.

> Cost is kept near-zero by design: the live-publish loop only runs while an SSE client is
> connected and reads through the cache; the wicket-alert watcher self-paces (15s live / 5min
> idle). Full data-plan + scaling notes in **[DEPLOY.md](DEPLOY.md)**.

---

## Real-time (live line)

`GET /stream` is a **Server-Sent Events** endpoint. The backend pushes a `scores` event when the
live snapshot changes; both clients subscribe (web via `EventSource`, mobile via
`react-native-sse`) and apply updates instantly, falling back to polling if the stream drops.

---

## Optional sign-in (off by default)

Login is an **add-on, never required** — the app is free and complete logged-out. Google
sign-in (web + mobile) only appears once configured, and the one perk it unlocks is per-account
**match notifications**. Setup (Google Cloud + the env vars) is in **[AUTH.md](AUTH.md)**.

---

## Environment

Everything below is **optional** — the app runs with none of it. Add only what you need.

**`apps/backend/.env`**
```bash
UPSTASH_REDIS_URL=redis://…          # required to run (cache + comments/poll)
CRICAPI_KEY=…                        # or CRICAPI_KEYS=k1,k2,k3 — omit for demo mode
SEED_DATA=1                          # force demo mode even with a key (dev)
DATABASE_URL=…                       # optional Supabase Postgres (else Redis) for favorites/users
ALLOWED_ORIGINS=https://your-web.app # required in prod for cookie auth (CORS credentials)
GOOGLE_CLIENT_ID=…  AUTH_JWT_SECRET=… # enable Google sign-in (see AUTH.md)
```

**`apps/web/.env.local`**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_SITE_URL=https://cricketfastliveline.in
NEXT_PUBLIC_GOOGLE_CLIENT_ID=…        # optional — shows the Google button
```

**`apps/mobile/.env`**
```bash
EXPO_PUBLIC_API_URL=https://your-backend.up.railway.app
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=…    # optional — enables sign-in (see AUTH.md)
```

---

## API reference

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Status + `mode` (seed/live) |
| `GET /stream` | **SSE** live-score push |
| `GET /matches/live` · `/recent` · `/upcoming` | Match lists |
| `GET /match/:id/score` · `/squad` · `/bbb` · `/history` | Scorecard · XI · ball-by-ball · H2H |
| `GET /series` · `/series/:id/table` | Series list · points table |
| `GET /favorites?device_id=` · `POST/DELETE /favorites` | Saved matches (anonymous) |
| `POST /devices/register` | Push-token registration (per-device, per-account when signed in) |
| `GET/POST /match/:id/poll` · `/match/:id/comments` | Prediction poll · match comments |
| `POST /auth/google` · `GET /auth/me` · `GET /auth/config` · `POST /auth/logout` | Optional Google auth |

---

## App surfaces

- **Web:** server-rendered live scores, results, fixtures, series, T20 rankings, team pages,
  per-match page (live summary + win-probability + prediction poll + session/rate analytics +
  ball-by-ball commentary + scorecard + squads). Team-brand-coloured identity throughout.
- **Mobile (live line):** Home (Featured / Live / Series), and a match screen with tabs —
  **Live Line · Session & Rates · Scorecard · Squad · Info** — plus win-probability and narrated
  ball-by-ball. Favourites ★, settings, optional account.

> Win-probability and session/rate panels are **model estimates / analytics only** — not odds
> or betting features.

---

## Deploy

Auto-deploys from `master`: **backend → Railway**, **web → Vercel**. **Mobile → EAS** (manual
`eas build` / `eas submit`). Step-by-step runbook (data plans, domain, EAS, demo→prod):
**[DEPLOY.md](DEPLOY.md)**.

## License

ISC
