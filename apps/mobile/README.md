# LiveLine Guru — Android app (Expo / EAS)

React Native (Expo SDK 56) live-line app. This guide covers building and shipping the Android app.

> The app talks to the **backend** (`EXPO_PUBLIC_API_URL`). It does **not** hold any data keys.
> Whether it shows demo or live scores is decided by the **backend's** env on Railway
> (see [demo → prod](#demo--prod)), not by the app build.

---

## 1. Prerequisites
- **Node 22+** and **pnpm 11** (repo uses pnpm workspaces)
- An **Expo account** (the project is linked — `owner: mybyess-team`, `app.json → extra.eas.projectId`)
- For Play Store: a **Google Play Console** developer account
- `eas-cli` (use `npx eas-cli` — no global install needed)

## 2. Install & run locally
```bash
pnpm install              # from repo root
pnpm dev:mobile           # expo start — press a (Android), or scan QR in Expo Go
pnpm dev:mobile:web       # run it in a browser (web export preview)
```
Health check the project: `cd apps/mobile && npx expo-doctor` (should be 21/21).

## 3. Configure which backend the app uses
Baked in at build time from `eas.json`:
```jsonc
// apps/mobile/eas.json
"env": { "EXPO_PUBLIC_API_URL": "https://backend-production-233f.up.railway.app" }
```
Point it at a different backend by editing that value (per profile). Local dev (`__DEV__`) falls back to `http://localhost:3000`.

## 4. Build the app (EAS)
```bash
cd apps/mobile
eas login                                            # your Expo credentials

# APK for side-loading / internal testing
eas build --platform android --profile preview

# AAB for the Play Store
eas build --platform android --profile production
```
- `preview` → **APK** (installable directly on a phone)
- `production` → **App Bundle (.aab)** with auto-incremented version code

EAS builds in the cloud; the link to download the artifact is printed when it finishes.

## 5. Submit to Google Play
Config is ready in `eas.json → submit.production` (uploads to the **internal** track as a **draft**).

1. In Play Console create a **service account**, grant it release permissions, download its JSON key.
2. Save it as **`apps/mobile/play-service-account.json`** (already git-ignored).
3. Submit:
   ```bash
   eas submit --platform android --profile production
   ```
4. In Play Console, promote the draft from *internal → production* when ready.

## 6. After the listing is live
Set `NEXT_PUBLIC_ANDROID_APP_URL` on Vercel (web) to the Play Store URL — this turns the web app's
"Android — coming soon" buttons into real download links.

---

## App identity
- Package / bundle id: `com.cricketfast.live` (`app.json` — Android & iOS)
- Version: `1.0.0`, versionCode `1` (auto-increments on production builds)
- iOS config is present but the Play/EAS flow above is Android-only.

## Demo → prod
Nothing changes in the **app** — flip the **backend** on Railway. See the root
[`DEPLOY.md`](../../DEPLOY.md#demo--prod-what-to-add) for the data keys to add.
