# LiveLine Guru — Project Log & Context Handoff

> **Purpose:** a durable, in-repo record of *what this project is, what was decided, and why* —
> so any future session (or a fresh laptop / new Claude conversation) can pick up without
> re-deriving the context. Local memory files don't travel between machines; this does.
> Last updated: 2026-06-28.

---

## TL;DR — current state
- **Product:** **LiveLine Guru** — a fast, free cricket **live-line** app (live scores,
  ball-by-ball, session/rate analytics, scorecards, fixtures). Web + Android, one shared backend.
- **Stack:** pnpm monorepo — `apps/backend` (Fastify), `apps/web` (Next.js 15), `apps/mobile` (Expo RN).
- **Repo:** `git@github.com:mybyes/Cricketline.git`, branch `master` (auto-deploys: backend→Railway, web→Vercel).
- **Data:** runs in **demo/seed mode** with zero config; flip to live by setting a CricAPI key.
- **Brand:** renamed **CricketFast → LiveLine Guru** (see "Brand" below — this matters).
- **Maturity:** code is solid (21 unit tests, load-tested). NOT yet: published app, real users,
  real-Google-auth round-trip, telemetry. Those are deliberately deferred.

---

## ⚠️ Non-negotiable decisions & constraints (read before changing anything)

1. **NO betting features. Ever.** The user repeatedly asked for odds / bhav / session betting /
   "rate as trading parameter." These are illegal in India and Play-Store-banned. We build
   **analytics equivalents only** (session phase stats, a *model-estimate* win-probability that
   is explicitly "not odds", CRR/RRR rate charts). Hold this line.

2. **Near-zero running cost is the goal.** Target = CricLine functional parity at ~₹0/mo. Don't
   add paid infra/services casually. Cost guards are in place (see Architecture).

3. **Login is an add-on, never a gate.** The app is free and fully usable logged-out. Google
   sign-in is optional, off until env vars are set, and only unlocks per-account match
   notifications. Never gate core features behind auth.

4. **Don't scrape ESPNcricinfo/Cricbuzz from the backend.** Their CDNs (Akamai) 403 datacenter
   IPs — verified by probe. A free cloud host gets blocked. Use the API adapters instead
   (CricAPI + RapidAPI-Cricbuzz). RapidAPI works because *their* servers fetch, not ours.

5. **Telemetry, error-tracking, and a real-Google auth round-trip are DEFERRED** until there are
   real users — they carry ongoing cost / need real traffic to be worth it. Don't add them yet.

---

## 🏷️ Brand: CricketFast → LiveLine Guru (and why)

The project was originally "CricketFast" and the repo defaulted to the domain
`cricketfastliveline.in`. **That domain turned out to be a live, AdSense-monetized COMPETITOR**
— a different codebase on a DigitalOcean host, with Instagram `@cricketfastliveline`, X
`@cfll_live`/`@cfll_official`, and a `.com` sister domain. Confirmed **not ours** (the live
site's AdSense `ca-pub-2294186064217785` is not the user's).

**So we rebranded to "LiveLine Guru"** across web/mobile/backend/docs:
- Logo mark `CF → LG`; Android/iOS id `com.cricketfast.live → com.livelineguru.app`; deep-link
  scheme `cricketfast → livelineguru`; default domain → **`livelineguru.in`**.
- Kept the Expo `slug` (`cricketfast`) + `eas.projectId` — those are the EAS server link;
  changing the slug risks breaking `eas build`. Harmless leftover internal `cricketfast` tokens
  (npm name, storage keys, dev DB creds) are intentionally left.
- **`livelineguru.in` / `.com` were both available** to register as of 2026-06-28. **Do NOT use
  `cricketfastliveline.*` or the "Cricket Fast Live Line" name — it's a competitor's.**

---

## Architecture (the parts worth knowing)

- **Data fallback chain (never-blank rule):** `live CricAPI → fresh Redis cache → 7-day real
  backup → pre-filled "seed" set`. Real data (even stale) always wins; seed is the last resort,
  flagged `stale:true`, never written back into cache, and keyed by match id so a *real* match
  never shows fake data. Implemented in `services/cache.ts` + `services/cricapi.ts` + the routes.
- **Cost guards** (`services/cache.ts`, `index.ts`, `services/wicketWatcher.ts`):
  - live-publish loop runs only when an SSE client is connected, reads through cache, publishes
    only on change;
  - wicket-alert watcher self-paces (15s live / 5min idle);
  - **single-flight** in `cached()` — concurrent cache-misses coalesce into one upstream fetch
    (prevents a traffic spike from blowing the free quota);
  - rate limit is `RATE_LIMIT_MAX` (default 200/min per IP).
- **Real-time:** `/stream` SSE (Redis pub-sub → clients). Web `EventSource`, mobile
  `react-native-sse`. Both pause/close when the tab is hidden (low-internet friendly).
- **Auth:** Google ID-token → our HS256 session JWT (cookie for web, Bearer for mobile).
  Degrades to "not configured" (503) until `GOOGLE_CLIENT_ID` + `AUTH_JWT_SECRET` are set.

## What's built
- **Web:** live scores, results, fixtures, series + points tables, ICC rankings, team pages,
  per-match page (live summary + win-prob + prediction poll + session/rate analytics +
  ball-by-ball commentary + scorecard + squads). Team-brand-coloured identity. SEO: metadata,
  sitemap, robots, JSON-LD (WebSite/SearchAction, SoftwareApplication, Organization, FAQ,
  SportsEvent), PWA manifest.
- **Mobile (Expo):** Home (Featured/Live/Series), match screen tabs — Live Line · Session &
  Rates · Scorecard · Squad · Info — win-prob, narrated ball-by-ball, favourites, optional auth.
- **Backend:** all of the above + comments/poll, favorites, push (Expo), multi-key CricAPI
  rotation, RapidAPI-Cricbuzz fallback adapter.
- **Tests:** 21 unit tests (`pnpm test`) — fallback chain, single-flight, auth verify,
  points-table, win-prob math. Node's built-in runner via tsx (no test framework).

## Deployment state
- **Backend → Railway** (`backend-production-233f.up.railway.app`), auto-deploys from `master`,
  currently `SEED_DATA=1` (demo).
- **Web → Vercel** (`cricketline-mybyes.vercel.app`), auto-deploys from `master`.
- **Mobile → EAS** (manual `eas build`/`eas submit`), not yet published. Owner `mybyess-team`.
- A working **free CricAPI key exists in the local `apps/backend/.env`** (verified it returns
  real data) — but it's git-ignored, so it lives only on the original laptop. Recreate `.env`
  from `.env.example` elsewhere.

## 💰 What costs money (shopping list)
- **Data API** — the main one. Free CricAPI (100/day/key, pool a few) to start; CricAPI **M
  $12.99/mo** or **L $29.99/mo** when traffic grows. Everything works on free first.
- **Backend host** — Railway's free tier is gone; ~$5/mo always-on, or Render/Fly free with
  cold starts.
- **Domain** — register `livelineguru.in` (~₹1k/yr) and/or `.com`.
- **Play Store** — $25 one-time to publish Android.
- Redis (Upstash), web (Vercel), auth (Google OAuth) — **free**.

## Open items / next steps
1. **Register `livelineguru.in`/`.com`**, point at Vercel, set `NEXT_PUBLIC_SITE_URL` +
   `ALLOWED_ORIGINS`. (Code already defaults to `livelineguru.in`.)
2. **Go live with data:** set `CRICAPI_KEYS` on Railway, remove `SEED_DATA`. See `DEPLOY.md`.
3. **Publish the app:** `eas build`/`eas submit` (Play Console, $25). See `apps/mobile/README.md`.
4. Deferred until real users: analytics/error-tracking, real-Google auth round-trip, load at scale.
5. Optional internal cleanup: rename leftover `cricketfast` dev tokens (low value, harmless).

## Map of the docs
- `README.md` — usage guide (dev, data model, env, API).
- `DEPLOY.md` — deploy runbook + demo→prod + near-zero-cost data notes.
- `AUTH.md` — Google sign-in setup (backend/web/mobile).
- `ASO.md` — Play Store listing copy (title/short/long description).
- `PROJECT_LOG.md` — this file (decisions, rationale, history).

---

## Session history (the build, in order)
Each line is a commit on `master`, oldest first. Use `git log` for full messages.

```
Foundation:   keyless seed mode · Cricbuzz-style web portal · graceful CricAPI backoff/cache
Depth:        historic data + H2H + SEO · aesthetic overhaul · session analytics (stats not odds)
Real-time:    Redis pub-sub → SSE → live clients · win-probability · worm/rate charts
Mobile:       CricLine-style tabs · merge Session+Rates · Home Featured/Live/Series slider
Identity:     team-brand colour system (avatars, rivalry accent bars)
Auth:         optional Google sign-in (backend + web + mobile), gates match notifications
Cost:         cut live-data cost to near-zero (client-gated publish, adaptive watcher)
Resilience:   live-first with pre-filled fallback (lists + match detail) — never blank
Quality:      end-to-end review hardening · SEO/ASO pass · PWA manifest
Perf:         pause polling/SSE on hidden tabs · lazy images (low-internet)
Tests:        21 unit tests (fallback, auth, points-table, win-prob)
Load:         load-tested (~45k req/s raw; 300 SSE conns) → added cache single-flight
Rebrand:      CricketFast → LiveLine Guru (brand, ids, scheme, domain) after finding the
              old domain is a competitor
```

## How to resume on a new machine / session
1. Clone the repo, `pnpm install`.
2. Copy each `*.env.example` → `.env` (the real CricAPI key isn't in the repo — recreate it).
3. `pnpm dev:backend` + `pnpm dev:web` (+ `pnpm dev:mobile`) — runs in demo mode, no keys needed.
4. `pnpm test` to confirm green.
5. Read this file + `README.md` for context, then continue with the open items above.
