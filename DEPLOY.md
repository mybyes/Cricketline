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
1. Create a **free** key at cricketdata.org (or pool a few as `CRICAPI_KEYS=k1,k2,k3`).
2. Railway → backend service → **Variables**: add `CRICAPI_KEY` (and/or `CRICAPI_KEYS`), **remove `SEED_DATA`** (or set `0`).
3. Railway redeploys (~1–2 min). Confirm: `GET /health` shows `"mode":"live"`.
4. Web/mobile pick it up automatically (they just call the backend).

**Live-first, pre-filled fallback (never blank).** Once a key is set, the match-list and
series endpoints serve in this priority order, so the app always shows *something*:
`live API → fresh cache → 7-day real backup → pre-filled set`. Real data — even stale — is
always preferred; the pre-filled set only appears on a genuine cold-start failure (no key,
all keys over quota, or API down before the cache ever warmed) and is flagged `stale:true`.
A healthy API with simply no live match shows an honest empty Live tab (not fake matches),
while real recent/upcoming still populate.

> Free tiers are rate-capped, so heavy live-match traffic eventually needs a paid CricAPI plan.

### Near-zero-cost live data (the realistic path)
Goal: CricLine-style live line at ~₹0/month. What actually works:

- **Don't scrape ESPNcricinfo/Cricbuzz directly from the backend.** Their CDNs (Akamai)
  block **datacenter IPs**, which is exactly what a free cloud host is — you get `403 Access
  Denied`. Verified by probe. The free-looking scraper path dies in production.
- **Use the API adapters instead** (already built): `CRICAPI_KEYS` (pool several free keys —
  each 100/day — for ~300–500/day rotated) and/or `RAPIDAPI_KEY` (Cricbuzz). RapidAPI works
  from a blocked host because **their** servers fetch Cricbuzz, not yours.
- **The backend is now tuned to make free quotas last** (so you stay under both the API daily
  cap and the Upstash free 10k-commands/day budget):
  - the live publish loop only runs **when an SSE client is actually connected**, reads
    through the cache (≤1 upstream call per `LIVE_MATCHES_TTL`), and **publishes only on
    change** — not a fixed call every few seconds;
  - the wicket-alert watcher **self-paces**: fast (15s) only while a match is live, otherwise
    every 5 min.
- **Honest ceiling:** free CricAPI alone (even rotated) can't sustain *continuous* sub-10s
  ball-by-ball for many concurrent matches — that needs the paid **L $29.99** tier or the
  RapidAPI Cricbuzz plan. For a low-traffic hobby app with bursty match-day viewing, the free
  pool + the guards above is enough.

---

## Quick reference
- **Web deploy:** [`apps/web/README.md`](apps/web/README.md)
- **Android build/publish:** [`apps/mobile/README.md`](apps/mobile/README.md)
- **Health check:** `GET https://backend-production-233f.up.railway.app/health`
