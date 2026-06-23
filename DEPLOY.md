# CricketFast — Deployment Checklist

Stack: **Railway** (backend) · **Vercel** (web) · **Upstash Redis** · **Supabase** (optional) · **GitHub** · **Expo/EAS** (mobile).

> Current code runs in **SEED mode** (built-in demo data) so it works with zero data keys.
> To serve **real** scores, add a data key and unset `SEED_DATA` (Step 4).

---

## 0. Prerequisites
- GitHub repo: `mybyes/Cricketline` (pushed)
- Accounts: Railway, Vercel, Upstash, (optional) Supabase, (mobile) Expo + Google Play

## 1. Push the code
```bash
git push -u origin feat/cricbuzz-style-portal
# then open a PR and merge to master (Railway/Vercel deploy from the production branch)
```
> Pushing only auto-deploys **after** each host is connected to the repo (Steps 2–3). A branch
> gets a Vercel **preview** URL; production deploys from `master`.

## 2. Backend → Railway
Already connected (`backend-production-233f.up.railway.app`); redeploys on push to `master`.
Set **Variables**:

| Variable | Value | Required |
|---|---|---|
| `UPSTASH_REDIS_URL` | `rediss://…` from Upstash | ✅ |
| `SEED_DATA` | `1` (demo data) — remove for live | see Step 4 |
| `CRICAPI_KEY` *or* `CRICAPI_KEYS` | CricAPI key(s) | for live data |
| `RAPIDAPI_KEY` | RapidAPI key (Cricbuzz fallback) | optional |
| `DATABASE_URL` | Supabase Postgres URL | optional (Step 5) |
| `ALLOWED_ORIGINS` | `https://cricketfastliveline.in` | recommended for prod |
| `COMMENTS_ENABLED` | `0` to disable (comments UI already removed on web) | optional |

## 3. Web → Vercel  *(one-time setup — this is the missing piece)*
Pushing does **nothing** until this is done once:
1. Vercel → **Add New → Project** → import `mybyes/Cricketline`.
2. **Root Directory:** `apps/web`.
3. **Environment Variables:**
   | Variable | Value |
   |---|---|
   | `API_URL` | `https://backend-production-233f.up.railway.app` |
   | `NEXT_PUBLIC_API_URL` | `https://backend-production-233f.up.railway.app` |
   | `NEXT_PUBLIC_SITE_URL` | `https://cricketfastliveline.in` |
4. Deploy → test the `*.vercel.app` URL.
5. **Domain:** add `cricketfastliveline.in` in Vercel → Domains, then point DNS.
   ⚠️ That domain currently serves a **different** site — this replaces it.

After this, every push to `master` auto-deploys; branches get preview URLs.
*(Alternative: host web as a 2nd Railway service running `next build && next start` — then no Vercel.)*

## 4. Data — demo vs live  *(the key decision)*
- **Demo (now):** `SEED_DATA=1` → built-in sample matches/scorecards. Good for launch/preview.
- **Live:** set `CRICAPI_KEY` (paid M/L plan recommended; free = 100/day) **and remove `SEED_DATA`**.
  - Optional resilience: also set `RAPIDAPI_KEY` (Cricbuzz fallback). ⚠️ Its response mapper is
    built but **unverified** — test once after adding the key and adjust `cricbuzzSource.ts` if fields differ.
- Rankings are curated/static (`services/rankings.ts`) regardless.

## 5. Supabase (optional — persistent comments/favorites)
Set `DATABASE_URL` on Railway → tables (`favorites`, `device_tokens`, `match_comments`) auto-create on boot.
Without it, Redis fallback is used (fine for low volume).

## 6. Mobile → EAS (separate track)
The new web sections aren't in the app yet. To ship the existing app:
```bash
cd apps/mobile
eas login
eas build --platform android --profile production
eas submit  --platform android --profile production   # needs play-service-account.json
```
After listing is live, set `NEXT_PUBLIC_ANDROID_APP_URL` on Vercel to enable real download links.

---

### Minimum to go live (demo data): Steps 1–3 + Upstash URL → ~30 min.
### To go live with real scores: also do Step 4 (data key).
