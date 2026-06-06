# CricketFast (Cricketline)

**Live cricket scores, scorecards & upcoming fixtures** — free, fast, no login required.

Real-time cricket app built as a monorepo: Fastify API on Railway, Expo mobile app, Redis cache, optional PostgreSQL.

## Features

- **Live scores** — auto-refresh every 10 seconds
- **Full scorecards** — batting & bowling tables, tap any match
- **Upcoming matches** — scheduled fixtures with dates
- **Favorites** — save matches with ★ (no account needed)
- **Push notifications** — optional, device-based (no auth)
- **Works everywhere** — browser, iOS, Android via Expo

## Stack

| Layer | Tech |
|-------|------|
| Backend | Fastify, TypeScript, Docker |
| Cache | Upstash Redis |
| Database | PostgreSQL (optional — Supabase free tier) |
| Mobile | Expo 56, React Native, React Navigation |
| API data | CricAPI |
| Hosting | Railway |

## Quick start

```bash
pnpm install

# Backend (local)
pnpm dev:backend

# Mobile (browser — press w)
pnpm dev:mobile
```

Set `apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://your-backend.up.railway.app
```

## API

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check |
| `GET /matches/live` | Live matches |
| `GET /matches/upcoming` | Upcoming fixtures |
| `GET /match/:id/score` | Full scorecard |
| `GET /favorites?device_id=` | Saved matches |
| `POST /favorites` | Add favorite |
| `DELETE /favorites/:id` | Remove favorite |
| `POST /devices/register` | Push token (optional) |

## Deploy

**Backend:** Railway (Dockerfile) — set `CRICAPI_KEY`, `UPSTASH_REDIS_URL`

**Mobile:** Expo Go for dev, `eas build` for production APK/IPA. Not deployed to Railway.

## Auth

**Not required.** Favorites and push tokens use an anonymous device ID. No sign-up, no login.

## License

ISC
