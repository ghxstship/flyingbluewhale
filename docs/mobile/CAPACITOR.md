# Capacitor — App Store + Play Store distribution

**Status:** Scaffolded in Round 78 (G-033). The COMPVSS field app at `compvss.atlvs.pro` is the canonical mobile surface — Capacitor wraps that PWA in native iOS + Android shells for App Store / Play Store distribution. Nothing in the field flow changes; the wrapper is a distribution layer, not a re-platforming.

## Why this design

The PWA is already feature-complete: offline service worker, push notifications, camera capture, geolocation, native install banner. The remaining gap is **App Store / Play Store presence** — which some enterprise customers require for MDM-managed device deployment.

Capacitor's **remote-loading** pattern (server.url) is the canonical choice for server-rendered apps. The native wrapper is essentially a hardened WKWebView / WebView pointing at `https://compvss.atlvs.pro/m`. The PWA's existing service worker handles offline; Capacitor adds:

- App Store / Play Store install path
- Native push (APNs / FCM) bridged into the existing `push_subscriptions` table
- MDM enrollment compatibility (Intune, Jamf, Workspace ONE)
- App-attest / Play Integrity API (anti-abuse on the API layer)

This is the same pattern Notion, Linear, and Vercel Dashboard use for their iOS apps.

## What's in the repo

- **`capacitor.config.ts`** — config pointing at `compvss.atlvs.pro/m` in prod, `http://10.0.2.2:3000/m` in dev (Android emulator → host loopback).
- **`/ios/` and `/android/`** — generated locally via `npx cap add`. Gitignored. ~50MB+ of native tooling each.
- **npm scripts** — `cap:sync`, `cap:open:ios`, `cap:open:android`, `cap:run:ios`, `cap:run:android`.

## First-time setup (one-time per developer)

Prerequisites:

- macOS for iOS work, with XCode 15+
- Android Studio Hedgehog (2023.1.1)+ for Android work
- Node 20+ (already required by the repo)

```bash
# 1. From repo root, generate the native projects.
npx cap add ios
npx cap add android

# 2. Sync the Capacitor config + plugins into the native projects.
npm run cap:sync

# 3. Open in the native IDE.
npm run cap:open:ios      # → XCode
npm run cap:open:android  # → Android Studio
```

## Daily workflow

The web app is the source of truth. You almost never touch native projects.

```bash
# After updating capacitor.config.ts or installing a Capacitor plugin:
npm run cap:sync

# To run on a connected device or emulator:
npm run cap:run:ios
npm run cap:run:android
```

When the deployed PWA changes (which is most of the time), no Capacitor rebuild is needed — the WebView reloads `https://compvss.atlvs.pro/m` on next launch.

## Plugin install pattern

Capacitor plugins (camera, filesystem, push, geolocation, etc.) wrap native APIs and expose a JS interface. Install them like any npm package:

```bash
npm install @capacitor/push-notifications @capacitor/camera @capacitor/geolocation
npm run cap:sync
```

The PWA detects whether it's running inside Capacitor via `Capacitor.isNativePlatform()` and routes to the native bridge when available, falling back to standard Web APIs (which are already wired in the PWA) when not. Detection lives in `src/lib/platform.ts` (add this when the first plugin is wired).

## Submission checklist

### App Store (iOS)

1. **Apple Developer Program** — $99/yr, organization account preferred.
2. **App ID** — `pro.atlvs.compvss` (matches `appId` in `capacitor.config.ts`).
3. **Provisioning profile + signing cert** in XCode.
4. **Icons + splash** — 1024x1024 App Store icon, plus all density buckets. Use `cordova-res` or `capacitor-assets` to generate.
5. **App Privacy** — declare camera, location, push, photo library access in `ios/App/App/Info.plist` and the App Store Connect privacy questionnaire.
6. **TestFlight** for internal QA before public submission.
7. **App Store review** — typical 24–72h turnaround.

### Play Store (Android)

1. **Google Play Console** — $25 one-time.
2. **Application ID** — `pro.atlvs.compvss`.
3. **Signing key** — managed by Google Play App Signing (recommended).
4. **Targeted SDK** — Android 14 (API 34) minimum for new uploads per Google's 2024+ policy.
5. **Data safety** — declare collected data + uses in the Play Console questionnaire.
6. **Internal testing track** for staged rollout.

## Out of scope for this scaffold

The following are real engineering deliverables but explicitly NOT in Round 78:

- Native push integration (would need `@capacitor/push-notifications` plugin + APNs/FCM credentials + the existing `push_subscriptions` table extended with `platform`).
- Native camera permission prompts (the PWA already uses `getUserMedia`; wrap in Capacitor's camera plugin when the team decides to ship).
- App attestation / Play Integrity (defense-in-depth on the API layer).
- White-label brand variants (multiple `appId`s for OEM partners — possible but out-of-scope until requested).

## Why not Expo / React Native?

The PWA is already shipping. Re-implementing it in React Native would be a 6+ month rewrite for zero feature gain — every feature exists in the PWA already. Capacitor lets us ship the same codebase to App Store + Play Store with ~1 week of bring-up + ongoing maintenance overhead measured in hours per release.

If a future feature genuinely requires a native module that Capacitor can't bridge, we add a Capacitor plugin for just that surface. Full rewrite is not on the path.
