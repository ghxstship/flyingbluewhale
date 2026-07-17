# COMPVSS Universal Capture & Recognition — Technical Implementation Plan

**Date**: 2026-07-15 · **Scope**: `src/components/scanners/**`, `src/app/(mobile)/m/{scan,check-in,inventory,door}`, `src/app/api/v1/scan`, `src/lib/db/assignments.ts`, `src/lib/offline/outbox.ts`
**Question**: can COMPVSS become a universal capture system — point the camera at any symbology, any product, or any physical state, and get a correct record?
**Answer today**: no. One pipeline exists (org-internal entitlement codes), and three of the four UI "modes" that imply more are cosmetic.

Every claim below cites the file that proves it. Nothing is called working, partial, or absent without evidence. Where something needs hardware the webview can't reach, a paid licence we may not be allowed to use, or has an accuracy ceiling, it says so.

**What's left:** [`SCANNING_RBAC_BACKLOG.md`](./SCANNING_RBAC_BACKLOG.md) is the canonical list. Phases 0-2 here are LANDED.

**Deliverables map** — (a) current-state table · (b) per-problem recommendations live at the end of each Problem section (§1.3, §1.5, §1.6, §2.4 Recommendation, §3.3–3.4, §4.1) · (c) unified architecture = **Problem 4** · (d) roadmap · (e) acceptance criteria.

**The five findings that should change your mind:**

1. **The format allowlist is already a no-op on iOS.** The zxing fallback takes no hints (`CameraScanner.tsx:316`), so iPhones already decode all 17 symbologies — including every retail barcode — at gates today. Widening Android is *parity with shipped behavior*, not new risk. (§1.1)
2. **Three of the four scanner modes are cosmetic.** Access / Asset / **POS** / **NFC** all call the identical `submit(code)`. NFC animates rings and reads nothing. (§0, §1.5)
3. **Web NFC cannot fix NFC** — not on iOS (no WebKit impl) and **not on Android in our shell** (the WebView never plumbs the `nfc` permission). Real NFC = a native plugin + App Store round-trips. (§1.5)
4. **There is no good liquor database.** I measured it: Open Food Facts resolved **2 of 11 spirits** (~18%). A "scan anything, get a name" promise fails at 2 a.m. at the bar. (§2.4)
5. **For liquor counting, a $30 scale beats every vision approach here** (±1% vs ±15–25%). Answer that before funding Phase 4. (§3.2)

---

## 0. The shape of the problem

The current system is **one pipeline wearing four hats**. `CheckInScanner` offers Access / Asset / POS / NFC; all four call the identical `submit(code)` and resolve against the same table. The mode only changes a label, a CTA string, and an icon.

```
CheckInScanner.tsx:89-97   mode → cta / scanHint / isNfc   (labels only)
CheckInScanner.tsx:103     onManualSubmit → void submit(code)      ← no mode
CheckInScanner.tsx:145     onScan={(scanned) => void submit(scanned.value)}  ← no mode
```

`submit` is `useScanSubmit`, which posts `{ code }` — and only `code` — to `/api/v1/scan` (`useScanSubmit.ts:61`). The endpoint's Zod schema accepts `{ code, location? }` and nothing else (`scan/route.ts:17-20`). There is no mode, no kind, no surface discriminator anywhere on the wire.

So the four problems in this plan are really one: **the capture layer is richer than the resolve layer, and the UI advertises capability the backend never had.**

---

## (a) Current-state table

| # | Capability | Status | Evidence |
|---|---|---|---|
| 1 | Camera decode, native | **Works** | `CameraScanner.tsx:263-267` — `window.BarcodeDetector`, constructed with `{formats}` |
| 2 | Camera decode, fallback | **Works** | `CameraScanner.tsx:314-330` — dynamic `@zxing/browser` + `@zxing/library`, `decodeFromStream` reusing the existing `MediaStream` (no double prompt) |
| 3 | Torch | **Works, Chromium only** | `CameraScanner.tsx:200-208` (capability probe), `:381-395` (`applyConstraints({advanced:[{torch}]})`); comment at `:199` notes Safari ignores it |
| 4 | Decode dedupe | **Works** | `CameraScanner.tsx:84-85` — 1500 ms TTL, max 3 entries |
| 5 | Format allowlist enforcement | **Half-wired** | Applied on BarcodeDetector (`:267`); **not applied on zxing** — `new BrowserMultiFormatReader()` at `:316` takes no hints, so it decodes every format it supports. See §1. |
| 6 | Symbologies actually enabled | **2 of 13** | Default `["qr_code","code_128"]` at `CameraScanner.tsx:98` + `GatedCameraScanner.tsx:19`; `DoorScanner.tsx:148` passes the same pair explicitly; only `AccessControlScanner.tsx:111` widens (`+code_39, pdf417`) |
| 7 | Permission gating | **Works** | `GatedCameraScanner.tsx:30-33` → `requestPermission("camera")`; native path `permissions.ts:146-153` uses `@capacitor/camera` |
| 8 | Single-flight + burst buffer | **Works** | `useScanSubmit.ts:50-54, 73` — FIFO buffer, decodes during flight are queued not dropped |
| 9 | Haptic / audio feedback | **Works** | `useScanSubmit.ts:64,68,71` → `scanFeedback()` (`haptics.ts:85-88`) |
| 10 | Offline queue | **Works** | `outbox.ts` — IndexedDB `atlvs-punch-queue`; `/api/v1/scan` is allowlisted (`outbox.ts:30`) and in the SW list (`service-worker.js:29`); SW answers a failed POST with a 202 `queued` body (`service-worker.js:268-273`) |
| 11 | Queued-scan honesty | **Works** | `useScanSubmit.ts:20-23` + `:66-69` — a queued scan is surfaced as cautionary, never as an accept |
| 12 | Resolve: org entitlement codes | **Works** | `scan/route.ts:38-44` → `scanAssignment()` (`assignments.ts:260-299+`), matching `assignment_scan_codes` on `(org_id, code) WHERE active` (unique index `baseline.sql:21158`) |
| 13 | RBAC on scan | **Works** | `scan/route.ts:37` — `assertCapability(session, "check-in:write")`; granted to role `member` (`auth.ts:373`) and persona `crew` (`auth.ts:403`) |
| 14 | Rate limit | **Works** | `scan/route.ts:24-28` — `RATE_BUDGETS.scan` = 120/min (`ratelimit.ts:190`) |
| 15 | **NFC read** | **Decorative** | `CheckInScanner.tsx:128-141` renders only `.nfc-ring` spans + a `KIcon`. No listener, no effect. The component imports exactly two things (`:6`) — neither touches NFC. See §1.5. |
| 16 | Web NFC probe (exists, misfiled) | **Unreachable + incomplete** | `permissions.ts:62` (`hasNfc()`), `:183-184` (`new NDEFReader()`, `.scan()`) — but it lives inside `requestPermission("bluetooth")` (`:167`), `PermissionKind` has no `"nfc"` (`:19`), and `scan()` is called with **no `reading` listener**, so it grants permission and reads nothing. `CheckInScanner` never calls `requestPermission` at all. |
| 17 | **POS / product lookup** | **Absent** | `mode==="pos"` changes only labels (`CheckInScanner.tsx:95`). A UPC resolves against `assignment_scan_codes` like everything else → `not_found`. |
| 18 | **RFID (UHF)** | **Absent** | No reader integration anywhere. `assignment_scan_codes.kind` has an `'rfid'` enum label (`baseline.sql:221-227`) and `LinkAssetForm.tsx:43` can *store* one — that is data entry, not reading. |
| 19 | **Vision / photo analysis** | **Absent** | No image content blocks in any AI route (`ai/{chat,copilot,propose,embed-source,conversations}`); `chat/route.ts:13` pins text models. `@capacitor/camera` appears **only** at `permissions.ts:149` for a permission grant — `getPhoto` is never called. No file/photo input exists anywhere under `src/app/(mobile)/`. |
| 20 | GTIN/UPC storage | **Absent** | No `upc`/`gtin`/`barcode` **column** in any migration. `master_catalog_items` has `code` (org-internal), not a GTIN (`baseline.sql:10826-10843`). |

### Latent defects surfaced while verifying (not part of the ask, but load-bearing)

| # | Defect | Evidence |
|---|---|---|
| D1 | **`/m/inventory/scan` resolves against the wrong domain.** The page calls itself the "asset check-out / check-in scanner" and takes asset tags (`page.tsx:9-12`, placeholder "e.g. R7-014"), but posts to `/api/v1/scan` → `assignment_scan_codes` (`InventoryScanner.tsx:57,77`). An `assets.asset_tag` only resolves if someone also created an assignment scan code for it. | `InventoryScanner.tsx:6,57,77` |
| D2 | **The purpose-built asset endpoint is dead code.** `/api/v1/equipment/scan` reads `assets` by `asset_tag` and toggles state — and has **no client caller** (only `outbox.ts:32` lists it). Same for `/api/v1/accreditation/scan` (`outbox.ts:31`). | `equipment/scan/route.ts:37-44` |
| D3 | **`not_found` is never journaled.** `scanAssignment` returns `{result:"not_found"}` with no `logScanEvent` (`assignments.ts:298`). It structurally *cannot* journal one: `assignment_events.assignment_id` is `NOT NULL`, and an unknown code has no parent. **Today an unresolved code leaves zero trace** — which is exactly the data Problem 2 needs. | `assignments.ts:277-299` |
| D4 | **Scan journal never writes `body`.** `logScanEvent` inserts only `assignment_id, org_id, event_kind, actor_user_id, scan_code_id, result, location` (`assignments.ts:242-250`), but the recent-activity lists read `body` (`inventory/scan/page.tsx:20-26`) — always `null`. | `assignments.ts:242-250` |
| D5 | **`QuickScan` duplicates the hook.** It inlines its own `postFieldWrite` + feedback map (`QuickScan.tsx:23-29,41`) instead of `useScanSubmit`, so it lacks the single-flight buffer. | `QuickScan.tsx:41` |
| D6 | **Desktop scanners have no offline queue.** `AccessControlScanner` (`:111`) and `DoorScanner` (`:148`) go through server actions / RPC, not `postFieldWrite`, so they bypass the outbox entirely. | `AccessControlScanner.tsx:83`, `DoorScanner.tsx` |

D1/D2 together are the strongest argument for the Problem 4 router: the app already has two resolve domains and picks between them by **hardcoded endpoint**, incorrectly.

---

## Problem 1 — Symbology capture

### 1.1 The allowlist is already a no-op on half the fleet

The narrowing is **not enforced on the zxing path**. `CameraScanner.tsx:316` constructs `new BrowserMultiFormatReader()` with no `DecodeHintType.POSSIBLE_FORMATS`, so it decodes everything the library supports — verified against the vendored enum (`node_modules/@zxing/library/esm/core/BarcodeFormat.js`):

```
AZTEC CODABAR CODE_128 CODE_39 CODE_93 DATA_MATRIX EAN_13 EAN_8 ITF
MAXICODE PDF_417 QR_CODE RSS_14 RSS_EXPANDED UPC_A UPC_E UPC_EAN_EXTENSION
```

Which path runs is platform-determined (`CameraScanner.tsx:263`): `window.BarcodeDetector` exists in Android's Chrome-backed WebView, and does **not** exist in iOS WKWebView (WebKit has never shipped it). Therefore:

| Platform | Path | Formats actually decoded |
|---|---|---|
| Android (Capacitor WebView / Chrome) | BarcodeDetector | the 2 in the allowlist |
| iOS (Capacitor WKWebView / Safari) | zxing | **all 17 above** |

Two consequences that decide the recommendation:

1. **The "risk" of widening already ships.** Whatever false-positive exposure 1D symbologies carry, iOS COMPVSS users have carried it since the scanner landed. Widening Android brings it to parity with the behavior already in production — it does not introduce a new class of risk.
2. **There is a third silent widening.** If `BarcodeDetector` rejects the format list, the code retries `new Native()` with **no filter at all** (`CameraScanner.tsx:268-272`) — i.e. all formats. So the allowlist is best-effort even on Android.

### 1.2 Why is it narrowed? Honest answer: no recorded reason

I checked. `git log` on `CameraScanner.tsx` returns two commits (`3b949034` i18n, `e4071350` test armor); neither introduces or justifies the format list — the file arrived with `["qr_code","code_128"]` already as the default and every consumer copied it. There is no comment, ADR, or test pinning it (`grep` for `qr_code`/`code_128` across `*.test.*`/`*.spec.*` returns nothing).

So: **not a perf decision and not a documented false-positive decision — just an unexamined default.** I will not invent a rationale for it. But the *reasons it would be defensible to keep narrow* are real and worth stating, because they should shape the widening rather than block it:

- **1D symbologies without check digits are genuinely dangerous.** `CODE_39` (without the optional mod-43 check), `CODABAR`, and especially `ITF` have no mandatory integrity check. ITF is the worst offender: it is continuous, any even number of digits is structurally valid, and a partial scan across a truncated bar field decodes as a *shorter valid ITF code*. This is a well-known failure mode, not a hypothetical.
- **`UPC_E` ↔ `EAN_8`** are both 8 digits and confusable when the reader guesses.
- Decoding more formats costs CPU on the BarcodeDetector path only in that it inspects more candidate patterns; on a modern phone at ~30 fps this is not the binding constraint. **Perf is not a real argument here** and I would not use it to justify the status quo.

### 1.3 Recommendation — widen per-mode, not globally

Do **not** flip everything to "all formats". Widen deliberately, and make the format set a property of the *mode*, because the mode genuinely changes what a valid code looks like:

| Mode | Formats | Why |
|---|---|---|
| `access` (gate, credentials, tickets) | `qr_code, code_128, pdf417, aztec, data_matrix` | PDF417 is what's on driver's licenses and most event tickets; Aztec is the transit/ticketing standard. **No 1D retail formats** — a gate should never accept a candy bar. |
| `asset` (gear, fleet, lots) | `qr_code, code_128, code_39, data_matrix` | Code 39 and Data Matrix are the dominant asset/DoD/industrial tag formats. Code 39 here is acceptable because asset tags are org-issued and checked against a table. |
| `pos` / receiving | `ean_13, ean_8, upc_a, upc_e, code_128, itf, data_matrix, qr_code` | The retail set. ITF only here (it's ITF-14 on cases), and only because a product lookup validates the GTIN checksum before it means anything. |
| `any` (Quick Scan) | union of the above | The catch-all surface; it's a lookup tool, not an authorization decision. |

**Guardrails that must ship with the widening** (these are the actual work; the allowlist edit is one line):

1. **Validate check digits before the code is trusted.** GTIN-8/12/13/14 all carry a mod-10 check digit. Compute it client-side and reject a mismatch as a decode error rather than shipping it to the server. This is what makes ITF safe enough to enable in `pos`.
2. **Require N-of-M agreement for checksum-less 1D.** For `code_39`/`codabar`/`itf`, require the same value twice within the dedupe window before emitting. The dedupe buffer already exists (`CameraScanner.tsx:84-85`) — this inverts it from "suppress repeats" to "confirm repeats" for those formats only.
3. **Pass hints to zxing.** Fix the asymmetry (`CameraScanner.tsx:316`) so `formats` actually binds on iOS: build a `Map<DecodeHintType, unknown>` with `POSSIBLE_FORMATS` and pass it to the `BrowserMultiFormatReader` constructor. This makes the mode-scoped sets real on both platforms — and is the one change here that *reduces* what iOS currently accepts at a gate.
4. **Emit `format` to the server.** `ScannedCode.format` already exists (`CameraScanner.tsx:66`) and is thrown away at `useScanSubmit.ts:61`. Send it. The router (§4) needs it, and it's the only way to tell a UPC from a credential without guessing.

**Effort**: S. **Value**: high. This is the quick win — but "widen the array" alone is *not* the quick win; the checksum guard and the zxing hint fix are what make it safe.

### 1.4 Multi-format auto-detect

Point-and-decode falls out of the above once `format` reaches the server: the client decodes the `any` union, and the **router** (§4) dispatches on `format` + checksum shape rather than making the operator pre-select a mode. Mode becomes a *filter* the operator can impose ("only accept credentials at this gate"), not a prerequisite. That is the correct inversion — today the mode is a lie (it changes nothing); tomorrow it should be an optional constraint.

### 1.5 NFC — decorative today, and Web NFC cannot fix it

**Current state**: decorative (see current-state #15/#16). The rings animate; nothing reads.

**The headline, and it is not the intuitive answer: Web NFC cannot rescue this.** The obvious cheap fix — finish the `NDEFReader` code already sitting in `permissions.ts:183-184` — **does not work inside the Capacitor shell on either platform**:

| Platform | Web NFC in our shell | Why |
|---|---|---|
| iOS (WKWebView) | ❌ | WebKit has never implemented Web NFC. `NDEFReader` is `undefined`; no flag, no version. Apple exposes NFC only through native Core NFC. |
| **Android (Capacitor WebView)** | ❌ | **Android System WebView never plumbs the `nfc` permission.** Unlike camera/geolocation (which route through `WebChromeClient.onPermissionRequest`), NFC has no hook — `scan()` fails with `NotAllowedError: NFC permission request denied` and **there is no way to grant it**, because the request is never surfaced. |
| Android Chrome **browser** tab (the PWA, not the shell) | ✅ | Chrome 89+. This is where the existing code would work — and nobody uses COMPVSS that way. |

This is the trap in the current code: `hasNfc()` (`permissions.ts:62`) probes `"NDEFReader" in window`, which is **true in an Android Capacitor WebView** — the constructor exists; only the permission is unreachable. So a naive feature-detect would light up the NFC UI on exactly the platform where it silently fails. Any gating must probe by *attempting a scan*, not by sniffing the global.

Global Web NFC support is ~6% (Android Chromium only); Firefox has formally marked the API **"Harmful"**. It is not a platform to bet a credential program on.

So the real options are two:

**Option A — a Capacitor NFC plugin (the only path that works in the shell).**
- **Free**: `@exxili/capacitor-nfc` — MIT, NDEF read/write, iOS 13+ and Android, handles the iOS entitlement plumbing. **I verified Capacitor 8 compatibility directly**: `npm view @exxili/capacitor-nfc peerDependencies` → `{"@capacitor/core": ">=6.0.0 <9.0.0"}`, so our Capacitor 8.3.4 is in range. Caveat that matters: it is **v0.0.13 — pre-1.0**. Treat it as immature and pilot it before committing a customer.
- **Paid**: `@capawesome-team/capacitor-nfc` — mature, Capacitor 8 supported, adds HCE and raw tag commands. It is **sponsorware**: MIT once you have it, but not on the public registry (I confirmed `npm view` returns nothing). **$99/mo, $990/yr, or $1,980 one-time perpetual**, flat-rate.
- **iOS requirements**: the `com.apple.developer.nfc.readersession.formats` entitlement (`NDEF` / `TAG`), a non-empty `NFCReaderUsageDescription`, App ID capability, provisioning changes. iOS 11+ for NDEF; **iOS 13 + iPhone 7 or later** for `NFCTagReaderSession` (ISO 7816 / 15693 / FeliCa / MIFARE). Foreground reads always show Apple's system scan sheet — **you cannot scan silently**, which changes the gate UX materially vs. a camera.
- **iOS background tag reading is not viable for us** — it is URL-record-NDEF only, needs Associated Domains, and arrives as an app-delegate `NSUserActivity` that a plugin would have to marshal across the bridge to a remotely-loaded page. Don't plan on it.

**Option B — manual entry.** Already built (`CheckInScanner.tsx:155-178`), already honest, works everywhere today.

#### The remote-load implications, stated plainly

1. **Plugins *do* work with `server.url`** — this was worth confirming rather than assuming. Capacitor's `Bridge.java` injects the native bridge via `WebViewCompat.addDocumentStartJavaScript`, scoped to an origin allow-list built from `appUrl` — **which is `server.url` when configured**. So `https://compvss.atlvs.pro` gets the bridge, `Capacitor.isNativePlatform()` returns true, and `window.Capacitor.Plugins` is populated. Our existing `isNativePlatform()` (`permissions.ts:29-36`) already depends on this working.
2. **Only the `server.url` origin gets the bridge on Android.** Origins reached via `allowNavigation` do *not* (iOS/Android asymmetry). NFC calls must originate from `compvss.atlvs.pro` itself.
3. **⚠️ The service-worker interaction is a live risk specific to us.** When a service worker intercepts and serves the page, bridge injection can be bypassed and **all plugin calls fail** even after ready (Capacitor issue #5278). COMPVSS registers a SW on `compvss.*` — that is precisely the failure shape. **Test this before scoping any plugin work**; it also puts the existing camera-permission native path (`permissions.ts:146-153`) under suspicion.
4. **Deployment model changes.** Today a COMPVSS fix ships via Vercel. NFC behind a plugin pins the capability to the installed binary; a plugin bug needs an App Store round-trip. The web app must feature-detect, because the same URL serves the browser PWA where no bridge exists.
5. **App Store exposure increases.** Capacitor's own docs say `server.url` is "intended for use with live-reload servers" and **"not intended for use in production."** Guideline 4.7.1 requires apps use "capabilities available in a standard WebKit view" — NFC is definitionally not one. Plenty of apps ship `server.url` without rejection, but adding NFC sharpens the argument that this is a wrapper.

**Recommendation**: **Option B (manual) now, Option A only on a real customer requirement.**

The immediate, free, correct action is **stop lying about it**: delete the NFC mode from `CheckInScanner`, or gate it behind a genuine capability probe. Today an operator taps "NFC", watches three rings pulse, and then types the code in by hand — the animation is a promise no platform in our shell can keep, and it is worse than having no tab at all, because it teaches operators the feature is broken rather than absent.

If a customer's credential program is genuinely NFC-wristband-based: pilot `@exxili` (free, Cap-8-compatible, pre-1.0) on Android first, resolve the service-worker/bridge question, and budget Capawesome's $990/yr if the free plugin proves thin. That is a **product decision with an App Store tax and a maintenance model change** — not an engineering preference. Say it out loud before committing.

Also worth surfacing while we're here: **remote-load and offline-first are in tension**. With `server.url`, a cold start with no network is a white screen the user must force-quit — regardless of how good the service-worker outbox is. That contradicts COMPVSS's offline-first positioning and is a bigger latent problem than NFC. Bundling the web assets locally would fix the App Store exposure, the bridge caveats, and the offline cold-start together — a real architectural option, out of scope here, worth its own ADR.

### 1.6 RFID (UHF) — out of scope for the phone

**No phone reads UHF/passive RFID.** Phone NFC hardware is 13.56 MHz HF with a ~4 cm range; UHF asset tags are 860–960 MHz and need a dedicated radio and antenna. No plugin, no webview API, and no amount of camera work changes this. The `'rfid'` label in `assignment_scan_code_kind` (`baseline.sql:221-227`) and the `rfid` option in `LinkAssetForm.tsx:43` let you *store* an RFID value someone typed — they are not evidence of reading capability, and should not be read as such.

Honest options:

| Option | Reality |
|---|---|
| **Web Bluetooth → sled** | **Dead on both platforms.** iOS: WebKit has never implemented it (bug 101034, open since 2012), and every iOS browser is forced onto WebKit. **Android WebView: also no** — the WebBluetoothCG implementation-status doc lists Android WebView as "will be supported in the future"; `navigator.bluetooth` is `undefined` today. Same structural story as Web NFC: it works in desktop/Android *Chrome*, and not in our shell. Note `permissions.ts:167-176` has a `bluetooth` case calling `navigator.bluetooth.requestDevice` — **that path is unreachable in the Capacitor shell** for the same reason. |
| **Sled via native BLE + vendor SDK plugin** | Real but expensive: a custom Capacitor plugin wrapping Zebra/TSL SDKs, subject to every `server.url` caveat in §1.5, on both platforms. This is the only path to bulk inventory (RSSI, power tuning, streaming reads, trigger events). |
| **⭐ HID / keyboard-wedge mode** | **The pragmatic answer, and it works today.** A sled pairs over Bluetooth as a **keyboard** and *types* the tag EPC into the focused field — indistinguishable from a human typing, so it needs no bridge, no plugin, and no permission. The existing manual-entry input (`CheckInScanner.tsx:155-178`) **already works with a sled right now**, on both platforms, on the shipped binary. Zebra RFD40: configure via 123RFID Desktop → General Settings → BT Host Mode → **HID-Keyboard**. Zebra DataWedge and TagMatiks Wedge do the same. |
| **Purpose-built handheld** (Zebra/Honeywell, integrated UHF radio) | Vendor SDK, native, Android-only. The warehouse-scale answer. |

**Recommendation**: **keyboard-wedge, and say "out of scope" for everything else.**

The only engineering work is making the manual-entry input a good wedge target: **auto-focus it in asset mode, accept a fast machine-speed keystroke burst, and submit on the trailing Enter** rather than requiring a tap. That is a few hours against hardware the customer already buys, and it sidesteps every constraint in §1.5.

Be clear-eyed about the ceiling: **HID gives you an EPC string and nothing else** — no RSSI, no read-rate or power control, no session management, no bulk streaming. It is the right answer for *"scan one tag into a field."* It is **not** viable for *"walk the room and inventory 500 assets"* — that needs the vendor SDK and a custom plugin, i.e. a hardware program with a native-shell change, not a sprint. If bulk inventory is the actual requirement, that should be scoped as its own project with its own budget.


---

## Problem 2 — Product data resolution ("universal POS")

### 2.1 Why a UPC cannot live in the tables we have

Two structural facts decide the schema, and both are load-bearing:

1. **`assignment_scan_codes` cannot hold a product code.** `assignment_id` is `NOT NULL` (`baseline.sql:6611-6623`). A scan code is *an entitlement token issued to a party* — it cannot exist without a parent assignment. A GTIN is the opposite: it identifies a **class of object**, globally, owned by nobody, and is identical in every org on earth. Forcing a UPC in here would require inventing a fake assignment per product. **This is why the deliverable's "extend `assignment_scan_codes`" framing must be answered with: no — extend the resolver chain, not that table.**
2. **The unique index makes it worse.** `assignment_scan_codes_org_code_active_uniq` on `(org_id, code) WHERE active` (`baseline.sql:21158`) means one active row per code per org. Two crew members holding two bottles of the same Tito's would collide on the same UPC. Correct for wristbands; wrong for products.

Nowhere else fits either. `master_catalog_items` has `code` — **and it is `UNIQUE (org_id, code)`** (`baseline.sql:18925`), an org-internal catalog code, not a GTIN. There is **no `upc`/`gtin`/`barcode` column in any migration**, and no product cache table (`grep` for `upc|gtin|barcode|product_cache|openfoodfacts` across `supabase/migrations/**` returns only the `'barcode'` enum *label* at `baseline.sql:222`).

So: **net-new tables.** Two of them.

### 2.2 Schema

```sql
-- 1. Global, org-agnostic product cache. One row per GTIN, shared by every org.
--    NOT org-scoped: a UPC means the same thing in every tenant, and caching
--    per-org would multiply cost by tenant count for zero benefit.
create table public.product_records (
  gtin            text primary key,           -- normalized to GTIN-14, left-zero-padded
  brand           text,
  name            text,
  size_value      numeric,
  size_uom        text,                       -- ml / g / oz / ea
  category        text,
  image_url       text,
  source          public.product_source not null,  -- enum: open_food_facts | commercial | manual | crowd
  source_payload  jsonb,                      -- raw provider response, for re-derivation
  confidence      smallint,                   -- 0-100
  fetched_at      timestamptz not null default now(),
  refreshed_at    timestamptz,
  deleted_at      timestamptz
);

-- 2. Per-org binding: "this GTIN is this catalog item, to us."
--    This is where org opinion lives; the cache above stays neutral.
create table public.org_product_links (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  gtin            text not null references public.product_records(gtin),
  catalog_item_id uuid references public.master_catalog_items(id) on delete set null,
  asset_id        uuid references public.assets(id) on delete set null,
  link_state      public.product_link_state not null default 'unmapped',  -- LDP: *_state
  created_at      timestamptz not null default now(),
  created_by      uuid references auth.users(id),
  deleted_at      timestamptz,
  unique (org_id, gtin) where deleted_at is null
);

-- 3. Unresolved codes — fixes D3, and is the crowd-source/manual-add queue.
create table public.scan_unknowns (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.orgs(id) on delete cascade,
  code        text not null,
  format      text,
  seen_count  integer not null default 1,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  resolved_at timestamptz,
  unique (org_id, code)
);
```

Naming follows the LDP (`CLAUDE.md`): `link_state`, not `status`. `product_records` is deliberately **not** org-scoped — RLS grants read to any authenticated member and restricts writes to the service role; `org_product_links` carries the usual `is_org_member` policies.

`scan_unknowns` is the table that makes everything else possible. Today an unresolved code vanishes (D3) — it *cannot* be journaled, because `assignment_events.assignment_id` is `NOT NULL`. Without this table there is no manual-add queue, no crowd-source input, and no way to answer "what are people scanning that we can't resolve?" **Build it first; it is cheap and it is the measurement instrument for the whole problem.**

### 2.3 Normalization — do this before any lookup

Non-negotiable, and cheap:

- **Pad to GTIN-14.** UPC-A (12), EAN-13 (13), EAN-8 (8), and ITF-14 (14) are the same number space. Store one canonical form or the same bottle will miss the cache depending on which symbology was on the box.
- **Expand UPC-E → UPC-A** before padding. UPC-E is a zero-suppressed form; treating it as distinct guarantees cache misses.
- **Validate the mod-10 check digit and reject on failure.** No repo helper exists (`grep` for `check.?digit|mod10|gtin|luhn` across `src/lib/` returns nothing) — this is ~15 lines in a new `src/lib/scan/gtin.ts`, unit-testable, and it is what makes enabling ITF in §1.3 safe. **A code that fails its own check digit must never reach a paid external lookup.**

### 2.4 Provider strategy

The decisive question is **not** price — it is **"may we store the response?"** A provider that forbids persistence makes `product_records` a ToS violation and forces a live call per scan, which kills the offline story and multiplies cost. That disqualifies it for a field app that must work in a basement, regardless of coverage.

| Provider | Coverage | Cost | Rate limit | Caching / license | Freshness |
|---|---|---|---|---|---|
| **Open Food Facts** | Food & beverage; **spirits are thin** (measured below) | **Free** | Norm is "1 API call = 1 real scan"; scraping discouraged — **but full nightly exports** (MongoDB, JSONL, Parquet, CSV) make the API mostly unnecessary | **ODbL** (DB) + **DBCL** (contents); images CC-BY-SA. Caching/import explicitly fine. **Share-alike applies if we publicly distribute a derived DB** — internal use is unencumbered. | Crowd-sourced, continuous; **quality is uneven** |
| **UPCitemdb** | Broad retail/CPG | Free "Explorer" **100 req/day**; **DEV $99/mo** (20k lookups/day); **PRO $699/mo** (150k/day). Overage **$0.04 per 100 lookups** (= **$0.0004/lookup**) | 429 over daily limit by default | **Not stated in their docs — must be resolved in writing before we cache.** They do state Amazon/eBay-sourced sales info is web-only and non-redistributable. | Commercial aggregation |
| Barcode Lookup / Go-UPC / Nutritionix / EAN-Search | Broad / nutrition-specific | Not verified — **do not quote numbers we haven't confirmed** | — | **Same caching question must be asked first** | — |
| ~~Datakick~~ / ~~Brocade.io~~ | — | — | — | **Dead. Do not propose these.** I checked: `datakick.org` returns a page whose entire body is *"No longer available"*; `brocade.io` does not resolve (connection failure). They still surface in "open UPC database" listicles. | — |
| **GS1 US Data Hub** — Product *View/Use* | **GTIN-only search hits the global registry: "more than 395 million products."** Filtered/advanced search covers only the **~45M GS1-US-licensed** slice | **$500** (View/Use). **API Add-On $6,500 flat**; Export Add-On **from $5,000**. Free public "Verified by GS1" web lookup is **30 queries/day** | Per-tier | **⚠️ The likely dealbreaker.** The Data Hub API *Trial* Agreement §4 restricts use to *"internal business or educational purposes"* and bars *"distribute, sell or resell … Platform Data"* without express written authorization. **Paid/Snowflake terms were not retrievable and may differ.** | Registry, hourly refresh on the Snowflake feed |
| **Build-own catalog** | Exactly our SKUs, 100% | Operator time | None | Ours | Always current |

Three things to understand about this table:

**GS1 is more than prefix attribution — I had this wrong and checked.** It is easy to assume GS1 only answers "who owns this prefix." Not so: **Product View/Use is explicitly a third-party lookup product**, marketed to retailers to validate other companies' data, returning GTIN attributes, record status (Active/Discontinued), hierarchy, and licensee info. The catch is the shape: **broad but shallow globally** (GTIN-only search across 395M records), **rich but narrow domestically** (filtering only over the 45M US slice). A "not found" means the licence is active but the brand isn't sharing attributes. There is also a **GS1 US Snowflake Marketplace** feed (800M+ records, hourly) — but its "Free" badge is a 1,000-record sample and real pricing is "by request," so **do not plan against a number we don't have**.

**The GS1 licensing question is sharper for us than for a retailer**, and it is the reason I am not recommending it. "Internal business purposes" is a comfortable fit for a retailer validating its own catalog. ATLVS is **multi-tenant**: surfacing GS1-derived product attributes to a customer's bar staff is plausibly *distribution*, which the trial terms bar without written authorization. That is a question for counsel and a GS1 rep, not for an engineer reading a PDF — and it must be settled **before** any GS1 data lands in `product_records`, because a shared global cache is the most distribution-shaped thing in this design.

**Open Food Facts' export changes the architecture.** Because the full dataset is downloadable under ODbL, the right integration is **not** an API call per scan — it is a **periodic bulk import into `product_records`**. That makes the food/beverage tier free, offline, rate-limit-free, and instant, and it removes the "1 call = 1 scan" etiquette question entirely. This is a strictly better shape than live lookups and should be the default.

#### Measured coverage — I tested this rather than guessing

I queried the OFF production API for 15 real consumer barcodes (spirits, beer, soda), then validated each against its mod-10 check digit to separate genuine gaps from codes I'd misremembered. **14 of 15 were well-formed** (the Jack Daniel's code I used was check-digit invalid, so it is excluded — a real scanner would never emit it; note the §2.3 helper caught it *before* it could have hit a paid lookup, which is exactly its purpose).

| Segment | Resolved | Rate |
|---|---|---|
| Spirits (Tito's, Grey Goose, Jameson, Smirnoff, Bacardi, Patrón, Captain Morgan, Johnnie Walker, Crown Royal, Hennessy, Malibu) | **2 / 11** — only Tito's and Grey Goose | **~18%** |
| Soda / beer (Coca-Cola, Pepsi, Corona) | 2 / 3 | ~67% |
| **All valid codes** | **4 / 14** | **~29%** |

And **found does not mean good**: the Coca-Cola record came back as `Coca cola / "Coca cola can cokes LG"`. That is what crowd-sourced product data looks like — it needs cleaning before it reaches an operator's screen.

*Caveat, stated plainly*: a valid check digit proves a code is well-formed, not that it is the true GTIN for that brand — so a "miss" could be a wrong-but-valid code rather than a coverage gap. The sample is small and directional. But the direction is unambiguous and matches the known shape of the dataset: **OFF is a food database with incidental alcohol coverage.**

#### The honest verdict

**There is no good public database of liquor SKUs.** OFF resolves roughly one bottle in five in my sample; commercial APIs skew grocery/CPG; GS1 answers a different question. The long tail COMPVSS actually lives in — bar stock, road cases, radios, uniforms, industrial supplies — will resolve **worse than any of these numbers**, because most of it has no consumer retail presence at all. A pallet of stage deck has no UPC anyone has ever catalogued.

**Any plan that promises "scan anything, get a name" will fail at exactly the moment it matters** — the bar lead counting Fireball at 2 a.m.

That inverts the design, and it is why the chain in §2.5 leads with resolvers 1–4: **the org's own catalog is the product database; external providers are a bootstrap convenience that saves typing on the ~30% of items that happen to be groceries.** Sell it that way internally, or the feature will be judged against a promise it cannot keep.

#### Recommendation

**Hybrid, in this order:**
1. **Bulk-import Open Food Facts** into `product_records` on a schedule (ODbL, free, offline, no rate limit). Covers the beverage/snack tier and costs nothing per scan. The only licence obligation that bites is ODbL share-alike **if we publicly distribute a derived database** — internal use and serving our own app are unencumbered. (Contrast this with GS1, where the equivalent question is unresolved and adverse.)
2. **Manual add as the primary path for everything else** (§2.6) — the operator in front of the object beats any API for our long tail.
3. **Defer every paid provider.** Cost is not the blocker: UPCitemdb's overage is **$0.0004/lookup**, and even GS1's $500 View/Use tier is noise against an event budget. **The blocker is the right to cache and re-serve** — UPCitemdb's docs are silent on it, and GS1's trial terms actively bar redistribution without written authorization, which a multi-tenant SaaS arguably performs by design. Revisit only after (a) `scan_unknowns` proves real volume of *retail* codes OFF missed, and (b) caching + multi-tenant re-serving rights are confirmed **in writing** by that provider.

Sequencing matters: `scan_unknowns` (§2.2) is what tells us whether step 3 is ever worth doing. **Build the measurement before buying the data** — and before asking a lawyer to read a contract for data we may not need.

### 2.5 The chain, and how it stays offline-first

```
decoded code → normalize + checksum (client, free, offline)
  → resolver 1: assignment_scan_codes   (existing, org, exact)
  → resolver 2: assets.asset_tag        (existing but unwired — D2)
  → resolver 3: org_product_links → master_catalog_items   (org opinion)
  → resolver 4: product_records         (global cache — still just a DB read)
  → resolver 5: external provider       (network, costs money, ONLINE ONLY)
  → miss:      upsert scan_unknowns, return unresolved + offer manual add
```

Resolvers 1–4 are **all local DB reads**, so the offline story is inherited from the existing outbox with no new machinery: a queued scan replays and hits the cache. Only resolver 5 needs network, and it is deliberately last and skippable.

**Offline behavior**: when the SW answers with a queued 202 (`service-worker.js:268-273`), the scan is recorded but unresolved — and `useScanSubmit.ts:20-23`'s existing contract already says a queued scan is *not* verified. That contract extends here for free. Do **not** try to make external lookups queueable: replaying a paid lookup an hour later, for a bottle the operator has put down, buys nothing.

**Cache warming beats live lookup.** Because `product_records` is global and org-agnostic, a GTIN fetched once for any org is free for every other org forever. A venue's bar stock is a few hundred SKUs and highly repetitive — after the first shift, hit rate should be very high and the marginal external call rare. This is what makes the economics work, and it is the single strongest argument for the global-cache shape over per-org caching.

### 2.6 Unmatched codes

**There are three outcomes, not two — and conflating the last two is the classic mistake.**

| Outcome | Meaning | Action |
|---|---|---|
| **Resolved** | A resolver answered | Record the hit |
| **Unresolved** | A real, global GTIN that no store we consult carries | Record it. Chaseable: manual add, or a provider might have it |
| **Unresolvable** | **Not a global product identifier at all** | **Never chase.** Straight to manual entry |

That third class is large and invisible: per the GS1 General Specifications, restricted-circulation numbers (RCNs) "SHALL NOT be used globally", "are NOT GTINs", and are "never unique if they leave the restricted environment" — yet they are reserved **inside the same numeric ranges as GTINs** and pass the check digit, so they are indistinguishable by shape. Only the prefix reveals them. Concretely: retailer-internal RCNs (`20`–`29`), US random-weight deli codes (`02`, where the digits encode *that package's* price), company-internal ranges (`04`, `0000000`), ISBN/ISSN/ISMN (`977`–`979` — a different registry entirely; an ISSN identifies a *title*, not a package), coupons/refunds/demos (`980`–`983`, `99`, `952`), and foodservice ITF-14 case codes that no consumer database indexes.

**A barcode can have a valid check digit, a real issued prefix, and a live licensee — and have no product data in existence anywhere outside the brand owner's ERP.** Structural validity and data existence are unrelated properties. GS1 licenses a *prefix*, not products; there is no "SHALL register a GTIN" requirement anywhere in the spec.

Recording unresolvable codes as chaseable misses would fill the work queue with rows nobody can ever action, and would corrupt the one number the queue exists to produce: *how many real retail codes do we fail to resolve?* Implemented as `classifyGtinScope`/`isUnresolvableCode` (`src/lib/scan/gtin.ts`); the resolver skips them (`recordUnknownSafe`, `src/lib/db/scan.ts`).

1. **Always record — except the unresolvable.** Upsert `scan_unknowns` (increment `seen_count`). This is the only way to know what the field actually scans.
2. **Manual add, in the flow.** On a miss, offer "Add to catalog" prefilled with the GTIN → creates a `master_catalog_items` row + an `org_product_links` binding. The operator is standing in front of the object; they are the highest-quality data source available and the cheapest.
3. **Crowd-source across orgs — carefully.** A manual add is `source='manual'`, org-local. Promoting it to the shared `product_records` cache means one tenant's typo becomes every tenant's truth. Gate promotion on N independent orgs agreeing, or keep manual adds org-scoped and accept the duplication. **Default to org-scoped;** cross-tenant data promotion is a trust decision, not a caching optimization, and it should not be made implicitly by a cache layer.
4. **Rank the queue by `seen_count`** — a console surface showing "scanned 40 times, still unknown" turns the miss list into a work list.

### 2.7 Where it fires, and the API shape

**Extend `/api/v1/scan`** (§4.2) — do not add a route. It is already queueable in both the outbox (`outbox.ts:30`) and the SW (`service-worker.js:29`); a new endpoint would need both lists updated plus a SW version bump (`service-worker.js:10`), and would not queue on already-installed clients until they update.

Surfaces: `/m/check-in` in `pos` mode (today decorative — `CheckInScanner.tsx:95`), receiving/inventory intake, and `/m/scan` (Quick Scan) as the general lookup.

**The cost gate — the most important control in this section.** Resolver 5 spends money per call. It must **not** sit behind `check-in:write`, which every `member` (`auth.ts:373`) and every `crew` persona (`auth.ts:403`) holds, inside a 120/min bucket (`ratelimit.ts:190`). That combination is an unbounded spend surface reachable by every user on the roster. Requirements:

- A **separate capability** (`catalog:write` or similar) for external lookup — the cached path (resolvers 1–4) can stay on `check-in:write`, since it is a free DB read.
- A **separate, tighter rate budget** for resolver 5 specifically, well below 120/min.
- A **per-org monthly lookup cap** with a hard stop, since rate limits bound velocity but not spend.


---

## Problem 3 — Vision-based measurement (photograph a bottle, estimate what's left)

### 3.1 Current state: nothing, and two building blocks are further away than they look

- **No vision anywhere.** Zero image content blocks across `src/app/api/v1/ai/**`; `chat/route.ts:13` pins `z.enum(["claude-opus-4-7","claude-sonnet-4-6"])` and sends text only.
- **`@capacitor/camera` is not a camera.** It appears exactly once, at `permissions.ts:149`, to call `Camera.requestPermissions({permissions:["camera"]})`. `getPhoto` is never called. **There is no photo capture UI in COMPVSS at all** — no `<input type="file">`, no `accept="image/*"`, nothing under `src/app/(mobile)/`.
- **The offline model does not accept photos.** This is the constraint that shapes the design. `postFieldWrite` stores `{endpoint, body}` where `body` is a **string** (`outbox.ts:57`), and `queue.ts:14-15` states the intent plainly: *"Payloads are small JSON records — this is not a general-purpose sync engine."* A base64 JPEG in IndexedDB via the SW outbox would be a category error — hundreds of KB per row, in a store designed for a 60-byte punch.

### 3.2 Accuracy — the honest ceiling

Single-photo liquor-bottle fill estimation is **an approximation, and should be sold as one**. The physics is unforgiving:

- **The container is not a cylinder.** Volume is not linear in liquid height. A bottle's shoulder/neck taper means the top 20% of height might be 5% of volume. Without knowing *that bottle's* profile, height→volume is a guess.
- **Angle destroys it.** Tilt changes the apparent ellipse of the liquid line and the perceived height ratio. A few degrees of camera pitch is worth several percent.
- **Glass lies.** Refraction through the liquid displaces the apparent liquid line; dark glass (most whiskey, all Jäger) can hide it entirely; back-lighting vs front-lighting moves the meniscus edge.
- **Labels occlude** the exact region you need to measure, by design.

Realistic expectations:

| Setup | Achievable | Honest verdict |
|---|---|---|
| Casual single photo, any angle, any bottle | **±15–25%** | Fine for "about a third left"; useless for variance/shrinkage accounting |
| Controlled capture: bottle upright, camera level, known bottle profile, decent light | **±5–10%** | Genuinely useful for par-level decisions |
| Controlled + reference marker + per-SKU calibrated profile | **±3–5%** | Approaching the commercial bar-inventory tools — and those companies exist because this is hard |
| Any setup, dark/opaque glass | **fails** | Must fall back to manual. Do not fake a number. |

**The industry answer to "how much is in the bottle" is a scale, not a camera** — weigh it, subtract the known empty weight, divide by density. That is ±1% for a few dollars of hardware. If the actual business goal is end-of-shift liquor variance, **a $30 Bluetooth kitchen scale beats every vision approach in this document**, and I would say that to the customer before writing any of the code below. Vision wins only where you cannot touch the bottle or cannot afford the per-bar hardware.

### 3.3 Approach comparison

| Approach | Latency | Cost | Offline | Privacy | Accuracy | Verdict |
|---|---|---|---|---|---|---|
| **On-device CV** (edge/liquid-line detect via OpenCV.js / WASM) | ~50–200 ms | free after ~2–5 MB WASM download | **yes** | image never leaves device | Good at *finding a strong horizontal edge* in a clean shot; brittle on dark glass, labels, glare | Best as a **capture-quality assist**, not the estimator |
| **Cloud vision (Claude, extends our existing SDK)** | ~2–6 s | see below | **no** | image leaves the device to Anthropic | Good at semantic judgment: *which* bottle, is the label X, is this ~half; not a metrologist | **Recommended** for v1 |
| **Trained model** (custom CNN, per-SKU) | ~100 ms on-device / ~1 s hosted | training data + labeling + MLOps | possible | good | Best ceiling, needs thousands of labeled bottles per SKU family | **Out of scope.** This is a research program, not a feature. |
| **Non-AI geometric** (reference marker + known bottle profile) | instant | free | **yes** | perfect | Deterministic *given* a marker in frame and a calibrated profile | **Wins where you control the scene** — see below |

**Where the non-AI geometric method wins, plainly**: if you put a fiducial marker (an ArUco tag, or just a printed card of known height) behind the bottle and require an upright/level shot, you get a real pixel→mm scale and an angle check for free. Combine that with a per-SKU bottle profile (a lookup of "volume as a function of fill height" — measurable once per SKU, reusable forever), and height→volume becomes arithmetic with no model at all. It is more accurate, free, offline, and private. **Its cost is discipline**: someone must print markers and profile each SKU. That trade is worth naming explicitly rather than defaulting to AI because AI is available.

Recommended combination: **cloud vision for v1** (no per-SKU setup, ships fast, degrades honestly), with the **geometric path as the accuracy upgrade** for customers who will do the setup. On-device CV is used for neither estimate — it's the thing that tells the operator "you're tilted, the bottle is cut off, it's too dark" *before* the shutter, which is the single highest-leverage accuracy lever available.

### 3.4 Cloud vision: the concrete shape

Claude supports image content blocks (base64 or URL `source`) on `client.messages.create`. Facts that matter here:

- **High-resolution vision is available on Opus 4.7+ and Sonnet 5**: max **2576 px** long edge (up from 1568 px), and coordinates map 1:1 to real pixels — relevant if we ever ask for the liquid-line y-coordinate rather than a percentage.
- **A full-resolution image costs up to ~4784 input tokens** (vs ~1600 at the old 1568 px cap). For a fill estimate we do not need 2576 px — **downsample to ~1024 px long edge**, which cuts image tokens hard with no meaningful loss for "where is the horizontal line."
- **Structured outputs** (`output_config.format` with a JSON schema) are supported on Opus 4.8 / Sonnet 5 / Haiku 4.5 — this is how we get `{fill_pct, confidence, reason}` back reliably instead of parsing prose.

Cost per photo (input side, ~1024 px ≈ roughly 1.5–2k image tokens + a short prompt; output is a tiny JSON object):

| Model | Input $/MTok | ≈ cost / photo | Note |
|---|---|---|---|
| `claude-opus-4-8` | $5.00 | **~$0.01** | Default per repo/API guidance |
| `claude-sonnet-5` | $3.00 ($2.00 intro through 2026-08-31) | **~$0.005** | |
| `claude-haiku-4-5` | $1.00 | **~$0.002** | Cheapest; **verify `image_input` support via the Models API before assuming** |

At a realistic bar count — say 60 bottles × 2 counts/day × 30 days = 3,600 photos/month — that is **~$36/mo on Opus, ~$18 on Sonnet**. This is not the expensive part of the feature; the capture UX and the correction loop are. Batch API halves it if counts are submitted end-of-shift rather than live, which they naturally are.

**Model choice**: default to `claude-opus-4-8` per our standing guidance. Do not silently downgrade to Haiku for cost — surface the tradeoff and let the operator's budget decide. Note the repo's existing `chat/route.ts:13` enum (`claude-opus-4-7`/`claude-sonnet-4-6`) is stale and should not be copied into the new route.

### 3.5 Capture UX — this is where the accuracy actually comes from

The model is not the lever. The scene is. Ship, in order:

1. **A framing overlay**, not a freeform camera: a bottle-shaped silhouette with a base line and a cap line. The operator seats the bottle in the outline. This alone removes most scale and cropping error.
2. **A live level indicator** — reuse the device orientation to refuse the shutter beyond ~5° of tilt. Cheap, deterministic, and kills the single largest error term.
3. **Glare / darkness check** before submit (a mean-luminance and a blown-highlight ratio on a downscaled canvas — a few lines, no library).
4. **SKU binding**: the operator scans the bottle's **barcode first** (Problem 1 + Problem 2 — this is where the pipelines compose), so the analyzer knows *which* bottle and can load its profile. Guessing the bottle from the photo is a strictly worse version of a barcode we can already read.
5. **Confirm-and-correct — mandatory, not optional.** The estimate lands as a **draft with a slider pre-set to the model's guess**, never as a committed number. The operator nudges and confirms. The recorded row stores **both** the estimate and the human's final value.

Point 5 is the difference between a feature and a liability. It also compounds: every correction is a labeled training pair `(image, sku, human_value)`, which is exactly the dataset the "trained model" row in §3.3 would need. Ship the correction loop first and the option to build a real model buys itself over a year.

**Never auto-commit a vision estimate to an inventory count.** A wrong number that a human confirmed is an operational fact; a wrong number the system asserted is a bug report and a trust loss.

### 3.6 The offline path for photos — do not force it through the outbox

The existing outbox is the wrong tool (§3.1). Design:

```
capture → downscale to ~1024px + JPEG q0.7 in a canvas (client)
        → store the BLOB in a separate IndexedDB store ("atlvs-capture-blobs"),
          NOT the punch queue
        → POST /api/v1/vision/analyze (multipart or base64)
             online  → analyze, return draft estimate, operator confirms
             offline → keep the blob; the *count row* is what queues
```

The key insight: **the photo does not need to be replayed — the count does.** When offline, skip analysis entirely, let the operator enter the value manually (they are standing in front of the bottle; they are a better sensor than a queued photo), and queue that small JSON count row through the existing `postFieldWrite`. Optionally sync the blob later for the training set, at low priority, over WiFi. This keeps a 200 KB JPEG out of a store whose own docstring says it is for small JSON records, and it means the offline experience is *manual entry* — which is honest, instant, and already the fallback everywhere else in COMPVSS.

### 3.7 New route

`POST /api/v1/vision/analyze` — **not** an extension of `/api/v1/scan` (that endpoint is code-in/verdict-out; this is blob-in/estimate-out, with different latency, cost, and failure modes).

- **Rate limit**: `RATE_BUDGETS.ai` (30/min, `ratelimit.ts:189`) — not the `scan` bucket's 120/min. This endpoint costs real money per call; it must not inherit a budget tuned for free table lookups.
- **Capability**: a **new** capability (e.g. `vision:write`), **not** `check-in:write`. This matters: `check-in:*` is held by every `member` (`auth.ts:373`) and every `crew` persona (`auth.ts:403`). Gating a paid, per-call vision endpoint behind the capability that every field user already holds is an unbounded cost surface. Bind it to the roles that do inventory counts.
- **Not queueable** — deliberately absent from `QUEUEABLE_ENDPOINTS` (`outbox.ts:27-33`) and the SW list (`service-worker.js:26-32`). Replaying a photo analysis on reconnect produces an estimate for a bottle the operator walked away from an hour ago.

**Effort**: L. **Value**: medium, and **contingent on the business case surviving §3.2's scale argument.**


---

## Problem 4 — Unification

### 4.1 The core move: resolve by identity, not by endpoint

Today the app picks its resolve domain by **hardcoded endpoint at the call site**, and gets it wrong (defect D1: `/m/inventory/scan` sends asset tags to the assignments resolver; defect D2: the asset resolver that would work has no caller). Adding a product pipeline on top of that pattern would produce a third wrong guess.

The fix is a **resolver chain**: one entry point, ordered attempts, first hit wins, and the *code itself* — plus its symbology and checksum shape — decides.

```
                    ┌───────────────────────────────────────────┐
  camera (any fmt)  │              CAPTURE                       │
  manual entry      │  CameraScanner → {value, format}           │
  HID wedge (sled)  │  ScanCapture / GatedCameraScanner          │
  NFC (if ever)     └──────────────────┬────────────────────────┘
                                       │  {code, format?, mode?, location?}
                                       ▼
                    ┌───────────────────────────────────────────┐
                    │   POST /api/v1/scan   (extended, not new)  │
                    │   withAuth + assertCapability + ratelimit  │
                    └──────────────────┬────────────────────────┘
                                       ▼
                    ┌───────────────────────────────────────────┐
                    │            RESOLVER CHAIN                  │
                    │  1. assignment_scan_codes  (entitlements)  │ ← exists
                    │  2. assets.asset_tag        (gear/fleet)   │ ← exists, unwired (D2)
                    │  3. product cache → external (GTIN only)   │ ← new, §2
                    │  4. unresolved → journal it                │ ← new, fixes D3
                    └──────────────────┬────────────────────────┘
                                       ▼
                    ┌───────────────────────────────────────────┐
                    │   WRITE: assignment_events (kind-scoped)   │
                    │          asset_movements / scan_unknowns   │
                    └───────────────────────────────────────────┘

  photo → POST /api/v1/vision/analyze  (separate: blob-in, estimate-out, §3)
          → draft → human confirm → count row → outbox
```

**Why extend `/api/v1/scan` rather than add routes**: it is already in `QUEUEABLE_ENDPOINTS` (`outbox.ts:30`) *and* the service worker's list (`service-worker.js:29`). Those two lists must stay in sync (`outbox.ts:26-27` says so explicitly), and every new queueable route costs a service-worker version bump (`VERSION = "v6"`, `service-worker.js:10`) plus a client update — during which an old SW won't queue the new endpoint. Extending the endpoint we already queue means **offline-first is inherited, not rebuilt**.

Vision is the deliberate exception (§3.7): it is blob-in/estimate-out, must *not* be queued, and needs a different rate bucket and capability.

### 4.2 Wire changes (small, additive, backward-compatible)

```ts
// scan/route.ts — extend the Zod schema (currently {code, location?} at :17-20)
const ScanInput = z.object({
  code: z.string().min(1),
  format: z.string().optional(),                    // from ScannedCode.format — today discarded at useScanSubmit.ts:61
  mode: z.enum(["access","asset","pos","any"]).optional().default("any"),
  location: z.object({ lat: z.number(), lng: z.number(), accuracy: z.number().optional() }).optional(),
});
```

`mode` becomes a **constraint, not a router**: `access` means "only resolver 1 may answer" (a gate must never accept a candy bar). `any` runs the full chain. This inverts today's semantics, where mode is decorative — and it makes the segmented control finally mean something.

`ScanResult` (`assignments.ts:218-223`) gains a discriminated `source`, so the UI can render "Crew badge — accepted" vs "Tito's 750ml — 2 in catalog" from one response shape. Note the existing type omits `wrong_zone` even though the DB enum and `logScanEvent` both carry it (`assignments.ts:238`) — worth closing while touching this.

### 4.3 Pipelines → personas → surfaces

| Pipeline | Resolver | Who | Surface | Capability |
|---|---|---|---|---|
| Gate access | 1 (assignment_scan_codes) | crew, security | `/m/check-in`, `/m/door`, `/studio/access-control` | `check-in:write` (crew has it, `auth.ts:403`) |
| Asset check-in/out | 2 (assets.asset_tag) | crew, warehouse | `/m/inventory/scan` — **fixes D1** | `check-in:write` |
| Receiving / POS | 3 (product) | warehouse, bar lead | `/m/check-in` (pos), receiving | **new** `catalog:write` — see below |
| Bottle count | vision (§3) | bar lead | new `/m/count` | **new** `vision:write` |
| Bulk asset sweep | HID wedge → 2 | warehouse | manual input, auto-focused | `check-in:write` |

**The RBAC point that matters**: `check-in:*` is held by role `member` (`auth.ts:373`) and persona `crew` (`auth.ts:403`) — i.e. effectively every field user. That is correct for gate scans (free table lookups, 120/min). It is **wrong for anything that costs money per call**. Both the external product lookup (§2) and vision (§3) must get their own capabilities, or every crew member on the roster is a billable endpoint with a 120/min budget. Reuse of `check-in:write` here would be the single most expensive mistake in this plan.

Related RBAC oddity, surfaced but out of scope: role `manager` has **no** `check-in` grant (`auth.ts:358-372` lists no `check-in:*`), so a manager persona is rejected by `/api/v1/scan` while a member is accepted. Probably unintentional; worth a separate look.

### 4.4 Presenting results consistently

One outcome card, one shape, regardless of pipeline — `ScanOutcome` (`useScanSubmit.ts:29-32`) already models `result | queued | error` and every surface renders it. Extend rather than replace, and preserve the two properties that are already right:

- **Queued ≠ accepted.** `useScanSubmit.ts:20-23` is explicit that a queued scan is unverified; the cue is `warning`, not `success`. Any new pipeline must inherit this. A product lookup served from a stale cache, or a vision estimate, must never render with the green accept cue.
- **Feedback is non-visual first.** `scanFeedback()` (`haptics.ts:85-88`) fires haptic + beep — operators at a gate are not reading the screen. Every new verdict needs a tone mapping, not just a string.


---

## (d) Phased roadmap — value vs effort

Ranked by value/effort. **Quick wins flagged ⚡.** Dependencies are explicit; nothing below depends on a phase after it.

### Phase 0 — Stop lying (⚡ hours, no dependencies) — ✅ LANDED 2026-07-15

The cheapest value in this document is **deleting three false promises**. Every hour here pays back in operator trust.

| # | Action | Why now |
|---|---|---|
| 0.1 ⚡ | **Remove or gate the NFC mode** (`CheckInScanner.tsx:128-141`) | It cannot work in our shell on either platform (§1.5). Probing `hasNfc()` is **not** sufficient — `NDEFReader` exists in the Android WebView while the permission is unreachable. Delete the tab, or gate it on a real scan attempt. |
| 0.2 ⚡ | **Remove or implement the POS mode** (`CheckInScanner.tsx:95`) | Today it is a label over the same resolver. Either wire §2 or stop offering it. |
| 0.3 ⚡ | **Auto-focus the manual input in asset mode; submit on trailing Enter** | This *is* the UHF/RFID story (§1.6). A Bluetooth sled in HID mode works the moment this lands. Zero plugin, zero risk. |

### Phase 1 — Symbology + the honest plumbing (⚡ S, depends on nothing) — ✅ LANDED 2026-07-15

| # | Action | Notes |
|---|---|---|
| 1.1 ⚡ | **Widen `formats` per-mode** (§1.3) | The literal quick win — but not alone. |
| 1.2 | **Pass `POSSIBLE_FORMATS` hints to zxing** (`CameraScanner.tsx:316`) | Fixes the platform asymmetry; this one *narrows* iOS, which today accepts all 17 formats at a gate. |
| 1.3 | **Add `src/lib/scan/gtin.ts`**: normalize (UPC-E→UPC-A→GTIN-14) + mod-10 validate | None exists. Pure function, trivially unit-tested. **Gates ITF safely** and stops malformed codes reaching paid lookups. |
| 1.4 | **Send `format` to the server**; extend the Zod schema with `format`/`mode` (§4.2) | `ScannedCode.format` already exists (`CameraScanner.tsx:66`) and is dropped at `useScanSubmit.ts:61`. |
| 1.5 | **N-of-M confirm for checksum-less 1D** (`code_39`/`codabar`/`itf`) | Invert the existing dedupe buffer (`CameraScanner.tsx:84-85`). |

**Dependency**: 1.1 should not ship without 1.3 + 1.5 — widening to ITF without a checksum guard is the one way this phase causes a regression.

> **Phases 0 + 1 landed 2026-07-15.** New SSOT `src/lib/scan/{formats,gtin}.ts`; NFC mode deleted;
> per-mode symbologies wired through every scanner; `format`/`mode` on the wire; server-side
> turnstile rule (`isOutOfScopeForMode`); HID wedge auto-focus. 40 new tests. Vision and UHF
> remain deferred by decision. **Phase 2 (below) is the next increment** — note 2.1/2.2 fix
> D1/D2/D3, which are live defects, not enhancements.

### Phase 2 — Fix the resolver chain (M, depends on Phase 1.4) — ✅ LANDED 2026-07-15

> **All of 2.1–2.5 landed.** `scan_unknowns` + `bump_scan_unknown` (migrations applied +
> verified); the resolver chain `src/lib/db/scan.ts` (entitlements → assets read-only →
> miss journal); unresolvable-code classification; `scanEventBody` so the recent lists stop
> reading an always-null column; `submitScanCode` as the shared submit core.
>
> **One item was dropped on inspection, deliberately — 2.4's `wrong_zone`.** The plan said to
> add it to `ScanResult` for symmetry with the DB enum. That is wrong: **no code path
> produces `wrong_zone`** (zone enforcement lives in the separate accreditation flow), so
> adding it would force every consumer to render a case that cannot occur. The mismatch is
> correct, not a defect: `logScanEvent`'s param mirrors the *journal's* vocabulary (the full
> DB enum), while `ScanResult` is the *resolver's* return vocabulary (narrower). Documented
> in `assignments.ts` so nobody "fixes" it later.
>
> **The open question is not code — it is authorization** (see below).

| # | Action | Status |
|---|---|---|
| 2.1 | `scan_unknowns` + journal misses (fixes **D3**) | ✅ 2 migrations, RLS + REVOKEs verified against the live DB |
| 2.2 | Resolver 2 (`assets.asset_tag`) in the chain (fixes **D1**, **D2**) | ✅ **read-only** — see the authz note below |
| 2.3 | `mode` as constraint | ✅ (landed with Phase 1) |
| 2.4 | **D4** — `logScanEvent` never wrote `body` | ✅ `scanEventBody(catalogKind, title)`; 5 of 6 call sites (the `anyCode` path has no assignment loaded, so null is honest) |
| 2.5 | **D5** — QuickScan duplicated the submit path | ✅ Extracted `submitScanCode` — the shared core (guard + POST + feedback). **Not** collapsed onto `useScanSubmit`: that hook's single-flight buffer returns early for a buffered code, which would leave QuickScan's log row statusless forever. The shapes genuinely differ; the core is what was duplicated. |

**⚠️ BLOCKING PRODUCT DECISION — asset toggle.** `/api/v1/equipment/scan` mutates
`assets.state` behind `projects:write`. This chain runs behind `check-in:write`, which
`member` and `crew` hold and which `crew` does **not** have for `projects:*`. Folding the
toggle in would silently grant every crew member asset-state mutation — a privilege
escalation dressed up as a bug fix. So resolver 2 **identifies** and stops.

That leaves `/m/inventory/scan` still not doing what its own page title claims ("asset
check-out / check-in"), because the crew who use it cannot toggle. Resolve one of:
**(a)** crew shouldn't toggle assets — then that surface is mis-scoped for crew; or
**(b)** asset toggle needs a capability crew holds — then define it deliberately, not by
inheriting `check-in:write`.

### Phase 3 — Product data (M–L, depends on Phase 1.3 + 2.1)

| # | Action | Notes |
|---|---|---|
| 3.1 | **`product_records` + `org_product_links` migrations** (§2.2) | LDP-named (`link_state`, not `status`). |
| 3.2 | **Bulk-import Open Food Facts** (ODbL, free, offline) | Not a per-scan API call. Covers the ~30% grocery tier at zero marginal cost. |
| 3.3 | **Manual-add flow from a miss** | The primary path for our long tail, not the fallback. |
| 3.4 | **New capability + tighter budget + per-org monthly cap** for any external lookup | **Blocking.** Never behind `check-in:write` (§4.3). |
| 3.5 | *(Conditional)* commercial provider | **Only after** `scan_unknowns` proves the volume **and** caching rights are confirmed in writing. |

### Phase 4 — Vision (L, depends on Phase 3.1)

| # | Action | Notes |
|---|---|---|
| 4.0 | **Answer the scale question first** | A $30 Bluetooth scale gives ±1% vs vision's ±15–25% (§3.2). If the goal is liquor variance, **the camera may be the wrong instrument** — resolve this before writing code. |
| 4.1 | Photo capture w/ framing overlay, level gate, glare check | The accuracy comes from here, not the model. |
| 4.2 | `POST /api/v1/vision/analyze` — `ai` budget, new capability, **not queueable** | §3.7. |
| 4.3 | Confirm-and-correct slider; store estimate **and** human value | Non-negotiable. Also builds the training set for free. |
| 4.4 | Bottle-profile lookup per SKU (the geometric path) | The real accuracy upgrade; needs SKU binding from Phase 3. |

### Deferred / out of scope (say so plainly)

| Item | Why |
|---|---|
| **NFC via Capacitor plugin** | Needs a native-shell change, App Store round-trips, and a resolution of the **service-worker × bridge-injection** risk (Capacitor #5278) that COMPVSS is squarely exposed to. Product decision, not an engineering one. Free option (`@exxili`, Cap-8 compatible — verified) is pre-1.0; mature option is $990/yr. |
| **UHF bulk inventory** | Vendor SDK + custom plugin. HID wedge (0.3) covers scan-one-tag; walking a room reading 500 tags is a hardware program. |
| **Trained vision model** | Thousands of labeled bottles per SKU family. Phase 4.3's correction loop generates the dataset; revisit in a year with real data. |
| **Web Bluetooth / Web NFC** | Unavailable in our shell on both platforms. Not a roadmap item; a dead end. Note `permissions.ts:167-176`'s `bluetooth` case is already unreachable in the shell. |
| **Local-bundled web assets** | Would fix App Store 4.7.1 exposure, the bridge caveats, and the offline cold-start (white screen) at once. Real, larger than this plan, **deserves its own ADR**. |

---

## (e) Acceptance criteria

Each is observable. "Works" means a test asserts it.

### Symbology (Phase 1)

- A **UPC-A, EAN-13, PDF417, Data Matrix, and Aztec** code each decode from `/m/scan` on both an Android and an iOS device. **Latency: first decode < 1 s** from a steady frame at ~20 cm.
- The **same physical Code-128 badge decodes identically on iOS and Android** — i.e. the zxing hint fix (1.2) made the platforms agree.
- A **checksum-invalid GTIN never reaches the server**: unit test over `gtin.ts` covers UPC-E expansion, GTIN-14 padding, and a mod-10 rejection (the Jack Daniel's code from §2.4 is a ready-made fixture).
- **A gate rejects a grocery item**: posting an `ean_13` with `mode:"access"` returns `not_found` and never consults the product resolver. This is the one that protects the turnstile.
- An `itf` code requires **two agreements inside the dedupe window** before emitting.
- **No regression**: the 2-format surfaces still decode QR + Code 128 at the same rate.

### Offline (all phases)

- A gate scan with the network off is **recorded and replayed on reconnect**, and is presented as *pending*, never accepted (the existing `useScanSubmit.ts:20-23` contract).
- A **cached** product lookup (resolvers 1–4) **succeeds fully offline** — this is the payoff of the global cache + bulk import.
- An **external** lookup offline **degrades to manual add**, and never silently queues a paid call for later replay.
- A **photo analysis offline falls back to manual entry**; no JPEG enters the punch queue (`outbox.ts` is for small JSON records by its own docstring).

### Product (Phase 3)

- A GTIN present in the OFF import resolves **from local DB, < 100 ms, no network**.
- An unknown code lands in `scan_unknowns` with `seen_count` incrementing on repeat — verifiable in the console, ranked.
- Manual add creates `master_catalog_items` + `org_product_links` and **the same code resolves instantly on the next scan**.
- **Cost containment**: a `crew` persona **cannot** trigger an external lookup (403), and an org that exceeds its monthly cap gets a hard stop, not a bill.
- **Honest coverage**: the hub reports real resolve rate. Given §2.4, **expect ~20–30% on retail beverage and near-zero on event gear** — the acceptance bar is *reporting it accurately*, not hitting a number.

### Vision (Phase 4)

- **Accuracy, stated as a range and tested against a ground truth of weighed bottles**: **±10% on 80% of controlled captures** (upright, level, clear glass, known SKU). **This is the target; do not promise better.** Dark/opaque glass is an explicit **fail → manual**, not a guess.
- **Latency**: estimate returned **< 6 s** p50 on a venue LTE connection.
- **Cost**: **< $0.02/photo** at ~1024 px downscale (measured, not assumed — see §3.4).
- **No auto-commit.** A vision estimate **cannot** reach an inventory count without a human confirming. Test: the API response alone never writes a count row.
- Both the model estimate and the human's final value are stored on every confirmed count.
- **Refusal to guess is a pass**, not a failure: low-confidence returns "can't tell — enter manually."

### RBAC / rate limits (all phases)

- `/api/v1/scan` keeps `check-in:write` + the 120/min `scan` bucket for resolvers 1–4.
- Every **paid** path (external lookup, vision) has its **own capability and its own budget**, and a test asserts a plain `member`/`crew` is rejected.
- The `manager`-has-no-`check-in` oddity (`auth.ts:358-372`) is either fixed or documented as intentional.

---

## Open questions for the product owner

1. **Is the liquor-count goal actually variance accounting?** If so, a $30 Bluetooth scale beats every vision approach here at ±1% (§3.2). Answer this before Phase 4 gets funded.
2. **Is there a real NFC credential program on iPhone?** That is the only thing that justifies a native plugin, the App Store exposure, and the maintenance-model change (§1.5).
3. **What actually gets scanned that isn't ours?** Phase 2.1 (`scan_unknowns`) answers this with data in one event. Every commercial-provider decision should wait for it.
4. **Do we want cross-tenant product sharing?** (§2.6 #3) — one tenant's typo becoming everyone's truth is a trust decision, not a caching optimization.
5. **Does anyone want to pay a lawyer to read a data licence?** If a paid provider ever becomes necessary (§2.4), someone must get **caching + multi-tenant re-serving** confirmed in writing. Open Food Facts needs none of this, which is a real part of why it is the recommendation.
