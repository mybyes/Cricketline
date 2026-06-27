# CricketFast — Deployment guide

Monorepo: **backend** (Fastify → Railway) · **web** (Next.js → Vercel) · **mobile** (Expo → EAS).
Shared services: **Upstash Redis** (cache + comments/poll), **Supabase** (optional Postgres), **GitHub** (`mybyes/Cricketline`).

| App | Deploys to | Auto-deploys from | Guide |
|---|---|---|---|
| Backend | Railway (`backend-production-233f.up.railway.app`) | push to `master` | below |
| Web | Vercel (`cricketline-mybyes.vercel.app`) | push to `master` | [`apps/web/README.md`](apps/web/README.md) |
| Mobile (Android) | EAS / Play Store | manual `eas build` | [`apps/mobile/README.md`](apps/mobile/README.md) |

> **Data flows one way:** mobile & web only read from the **backend**. Only the **backend** holds
> data keys, and only the backend decides demo vs live. Changing data mode = a Railway env change.

---

## Backend → Railway
Connected to the repo; redeploys on push to `master`. Set these **Variables**:

| Variable | Required? | What it does |
|---|---|---|
| `UPSTASH_REDIS_URL` | ✅ yes | Cache + backup store; fallback store for comments/poll/favorites |
| `SEED_DATA` | demo only | `1` = serve built-in demo dataset (no data key needed). Remove for live. |
| `CRICAPI_KEY` *or* `CRICAPI_KEYS` | live data | cricketdata.org key(s). `CRICAPI_KEYS` = comma list, auto-rotates on quota |
| `RAPIDAPI_KEY` | optional | Cricbuzz (RapidAPI) fallback source. `RAPIDAPI_CRICBUZZ_HOST` optional |
| `DATABASE_URL` | optional | Supabase Postgres → persistent comments/favorites (else Redis fallback) |
| `ALLOWED_ORIGINS` | prod recommended | comma-separated CORS allow-list (unset = allow all) |
| `COMMENTS_ENABLED` | optional | `0` disables the comments feature |
| `PORT` | optional | defaults to 3000 (Railway sets this) |

Local: copy `apps/backend/.env.example` → `.env`, then `pnpm dev:backend`.

---

## Demo → prod: what to add

**The web & mobile apps need ZERO changes.** Going live = swapping the backend's data source on Railway.

### Right now (demo)
`SEED_DATA=1` → the backend serves a complete built-in dataset (live matches, scorecards,
ball-by-ball, results, rankings). **No data key, no cost.** Good for launch/preview.

### To serve real scores — add a data API key
Pick one (or both for resilience), then **remove `SEED_DATA`** (or set `0`):

| Provider | Env var | Free tier | Notes |
|---|---|---|---|
| **cricketdata.org (CricAPI)** | `CRICAPI_KEY` | 100 req/**day** | Official, stable. Paid: **M $12.99/10k·day**, **L $29.99/100k·day** — recommended for live traffic |
| **Cricbuzz (unofficial, RapidAPI)** | `RAPIDAPI_KEY` | free tier (capped) | Richer data; unofficial/scraped, can break. Adapter: `apidojo` "Cricbuzz Cricket" |

- Set **both** → CricAPI primary, Cricbuzz fallback (the backend rotates automatically).
- `CRICAPI_KEYS=k1,k2,k3` → pool multiple free CricAPI keys to multiply the daily quota.
- **Rankings stay curated/static** (`services/rankings.ts`) — no extra API needed.
- **Comments / poll / favorites** use Redis by default; add `DATABASE_URL` (Supabase) only for persistence at scale.
- **Real-time** (`/stream` SSE) needs nothing extra — it pushes whatever data the backend already has.

### Steps to go live with real data
1. Buy/create the key (cricketdata.org **M** or **L** plan recommended).
2. Railway → backend service → **Variables**: add `CRICAPI_KEY` (and/or `RAPIDAPI_KEY`), **remove `SEED_DATA`**.
3. Railway redeploys (~1–2 min). Confirm: `GET /health` shows `"mode":"live"`.
4. Web/mobile pick it up automatically (they just call the backend).

> Free tiers are rate-capped, so heavy live-match traffic eventually needs a paid CricAPI plan.

---

## Quick reference
- **Web deploy:** [`apps/web/README.md`](apps/web/README.md)
- **Android build/publish:** [`apps/mobile/README.md`](apps/mobile/README.md)
- **Health check:** `GET https://backend-production-233f.up.railway.app/health`
