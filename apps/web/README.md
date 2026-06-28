# LiveLine Guru — Web app (Next.js / Vercel)

Next.js 15 SSR portal (live scores, scorecards, series, rankings, teams, search, real-time SSE).
Deployed on **Vercel**, talks to the **backend** on Railway.

> Currently live at **https://cricketline-mybyes.vercel.app** (auto-deploys from `master`).

---

## 1. Prerequisites
- **Node 22+**, **pnpm 11**
- A **Vercel** account with the GitHub repo (`mybyes/Cricketline`) connected
- The backend already deployed (Railway) — the web app only reads from it

## 2. Run locally
```bash
pnpm install            # from repo root
pnpm dev:web            # next dev on :3001
```
In dev it points at `http://localhost:3000` (run `pnpm dev:backend` too). To run dev against the
live backend instead:
```bash
API_URL=https://backend-production-233f.up.railway.app \
NEXT_PUBLIC_API_URL=https://backend-production-233f.up.railway.app pnpm dev:web
```

## 3. Deploy on Vercel (one-time setup)
Pushing to `master` only deploys **after** the project is connected once:
1. Vercel → **Add New → Project** → import `mybyes/Cricketline`.
2. **Root Directory:** `apps/web`  (build settings already in `apps/web/vercel.json`).
3. **Environment Variables:**

   | Variable | Value |
   |---|---|
   | `API_URL` | `https://backend-production-233f.up.railway.app` (server-side fetch) |
   | `NEXT_PUBLIC_API_URL` | same (client-side fetch / SSE stream) |
   | `NEXT_PUBLIC_SITE_URL` | `https://livelineguru.in` (canonical / sitemap) |
   | `NEXT_PUBLIC_ANDROID_APP_URL` | *(optional)* Play Store URL once the app is live |

4. Deploy → test the `*.vercel.app` URL.

After this, **every push to `master` auto-deploys**; branches get preview URLs.

## 4. Custom domain
Vercel → Project → **Domains** → add `livelineguru.in`, then update the registrar/DNS per
Vercel's instructions.
> ⚠️ That domain currently serves a **different** site — adding it here replaces it.

## 5. Real-time note
The web client subscribes to the backend's **SSE stream** (`/stream`) for instant score pushes,
with a 15s poll fallback. Vercel holds the connection fine; nothing extra to configure.

## Routes
`/` · `/live` · `/matches` · `/fixtures` · `/results` · `/series` (+`/series/[id]`) ·
`/rankings` · `/teams` (+`/team/[name]`) · `/search` · `/match/[id]` · `/sitemap.xml` · `/robots.txt`

## Demo → prod
The web app needs no change — flip the **backend** data mode on Railway. See the root
[`DEPLOY.md`](../../DEPLOY.md#demo--prod-what-to-add).
