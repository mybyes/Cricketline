# Sign-in (Google) — setup

Accounts are **optional and Google-only**. With nothing configured the app behaves
exactly as before (no sign-in UI, anonymous favourites, anonymous alerts). Turn it on by
setting the env vars below; the moment they're present, the Google button appears on the
web header and in the mobile **Settings → Account**.

What an account unlocks today: **per-account match notifications** (the "Enable Match
Alerts" opt-in requires sign-in once auth is configured). Everything else stays usable
logged-out.

```
Google ID token  ──►  POST /auth/google  ──►  our HS256 session
(client gets it)      (backend verifies)       cookie (web) / Bearer (mobile)
```

---

## 1. Google Cloud Console (one-time)

1. Create / pick a project → **APIs & Services → OAuth consent screen** (External, add your
   email as a test user while in testing).
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**, once per platform:
   - **Web application** — for the website *and* for Expo/mobile token verification.
     - Authorised JavaScript origins: `http://localhost:3001`, your Vercel URL
       (e.g. `https://cricketline-mybyes.vercel.app`).
     - Authorised redirect URIs: not needed for the web One-Tap/button flow.
   - **Android** — package name `com.livelineguru.app` + your signing-cert SHA-1
     (from EAS: `eas credentials`).
   - **iOS** — bundle id `com.livelineguru.app` (only if you ship iOS).
3. Note each **Client ID**. (No client *secret* is needed — we only verify ID tokens.)

---

## 2. Backend (Railway / local `apps/backend/.env`)

| Var | Required | Notes |
|-----|----------|-------|
| `GOOGLE_CLIENT_ID` | ✅ | The **Web** client ID — the primary accepted audience. |
| `GOOGLE_CLIENT_IDS` | optional | Comma-separated extra audiences (Android + iOS client IDs) so tokens minted on those platforms verify. |
| `AUTH_JWT_SECRET` | ✅ | Long random string used to sign our session JWT. `openssl rand -hex 32`. |
| `ALLOWED_ORIGINS` | ✅ in prod | Comma-separated web origins (e.g. your Vercel URL). Required for the cross-site cookie — CORS credentials can't use `*`. |
| `NODE_ENV` | prod | When `production` the session cookie is `SameSite=None; Secure` (web ↔ API are cross-site). |

`GET /auth/config` returns `{ enabled: true }` once `GOOGLE_CLIENT_ID` + `AUTH_JWT_SECRET`
are set; until then sign-in endpoints return `503 not configured`.

Optional: set `DATABASE_URL` (Supabase Postgres) to persist users/tokens in SQL; without it
they live in Redis (fine for demo).

---

## 3. Web (Vercel / local `apps/web/.env.local`)

| Var | Notes |
|-----|-------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | The **Web** client ID. The header button only renders when this is set *and* the backend reports `enabled`. |
| `NEXT_PUBLIC_API_URL` | Backend base URL (already used elsewhere). |

The browser loads Google Identity Services, gets an ID token, and posts it to
`/auth/google` with `credentials: 'include'` so the httpOnly session cookie is set.

---

## 4. Mobile (`apps/mobile/.env` / EAS env)

| Var | Notes |
|-----|-------|
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Web client ID — used by Expo Go and as the default. |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | Android client ID (for standalone Android builds). |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS client ID (only if shipping iOS). |

`app.json` already declares `"scheme": "livelineguru"` for the OAuth redirect. Sign-in uses
`expo-auth-session`; the returned Google ID token is exchanged at `/auth/google` and the
session token is kept in `AsyncStorage`.

> **Security upgrade for production:** move the mobile session token from `AsyncStorage` to
> `expo-secure-store` (`npx expo install expo-secure-store`) — it's encrypted at rest.

---

## 5. Verify

```bash
curl https://<backend>/auth/config            # -> {"success":true,"enabled":true}
curl -X POST https://<backend>/auth/google -H 'content-type: application/json' -d '{"idToken":"x"}'
                                               # -> 401 Invalid Google token (not 503/500)
```
Then open the web app → a Google **Sign in** button shows in the header; sign in → avatar +
account menu. In the app → **Settings → Account**.
