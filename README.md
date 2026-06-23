# CricketFast (Cricketline)

**Live cricket scores, scorecards & upcoming fixtures** — free, fast, no login required.

Monorepo: Fastify API (Railway), Expo mobile app (live-line depth), Next.js web portal (SEO).

## Apps

| App | Purpose | Dev command |
|-----|---------|-------------|
| `apps/backend` | API + CricAPI + Redis | `pnpm dev:backend` |
| `apps/mobile` | Android/iOS live-line app (8 match tabs) | `pnpm dev:mobile` |
| `apps/web` | SSR portal for cricketfastliveline.in | `pnpm dev:web` |

## Features

### Mobile app (deep live-line)
- **8 match tabs:** Live Line, Session, Rates, Scorecard, History, Squad, Table, Info
- Ball-by-ball (when API provides), CRR/RRR/target, extras on scorecard
- Favorites ★, fixtures, settings — no login

### Web portal (discovery / SEO)
- Server-rendered live scores, recent results, fixtures
- Popular series, T20 rankings, FAQs, ad slots
- Domain: `cricketfastliveline.in` via Vercel (`apps/web`)

## Quick start

```bash
pnpm install
pnpm dev:backend    # :3000
pnpm dev:mobile     # Expo — press w for browser
pnpm dev:web        # :3001 Next.js portal
```

### Demo / no-key mode

Set `SEED_DATA=1` (or simply leave `CRICAPI_KEY` unset) and the backend serves a built-in
dataset — 2 live matches, results, fixtures, full scorecards and ball-by-ball — so the whole
app runs and demos without any API key. Flip to live data at the end by setting a real
`CRICAPI_KEY` and `SEED_DATA=0`. The mobile app and web read the same backend, so both pick it
up automatically (point mobile at the seed backend via `EXPO_PUBLIC_API_URL`, or run `expo start`
in dev which uses `localhost:3000`).

### Env

`apps/backend/.env` — `CRICAPI_KEY` (or `CRICAPI_KEYS`, a comma-separated pool that auto-rotates when one key hits its daily quota), `UPSTASH_REDIS_URL`

`apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://your-backend.up.railway.app
```

`apps/web/.env`:
```
API_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_SITE_URL=https://cricketfastliveline.in
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /matches/live` | Live matches |
| `GET /matches/recent` | Recent results |
| `GET /matches/upcoming` | Upcoming fixtures |
| `GET /match/:id/score` | Full scorecard |
| `GET /match/:id/squad` | Playing XI |
| `GET /match/:id/bbb` | Ball-by-ball |
| `GET /match/:id/history` | H2H + recent form |
| `GET /series` | Series list |
| `GET /series/:id/table` | Points table |
| `GET /favorites?device_id=` | Saved matches |

## Deploy

> Full step-by-step runbook (data plans, Vercel domain swap, EAS build/submit): see [DEPLOY.md](DEPLOY.md).

### Backend (Railway)
- **Node 22+** required (pnpm 11 uses `node:sqlite`; Dockerfile uses `node:22-alpine`)
- Env: `CRICAPI_KEY`, `UPSTASH_REDIS_URL`, optional `DATABASE_URL` (Supabase Postgres for favorites)
- Scores cache in **Upstash Redis** (`matches:all:backup`, 7-day TTL) — survives CricAPI cooldowns after first successful fetch

### Web (Vercel) — **use this for cricketfastliveline.in**
1. Root directory: `apps/web`
2. Env: `API_URL`, `NEXT_PUBLIC_SITE_URL=https://cricketfastliveline.in`
3. `pnpm build:web`

### Mobile (EAS)
`eas build --platform android --profile preview`

## Auth

Not required. Anonymous device ID for favorites.

## License

ISC
