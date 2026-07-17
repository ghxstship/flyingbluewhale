/**
 * Per-mode symbology allowlists — the SSOT for what each scan surface accepts.
 *
 * WHY THESE ARE SCOPED BY MODE, not global:
 * a gate and a stockroom are looking for different things, and the format set
 * is the cheapest place to say so. An access surface that decodes EAN-13 can
 * be handed a candy bar; a receiving surface that only decodes QR is useless.
 * Mode is therefore a *constraint* on what a valid code can look like, not
 * decoration.
 *
 * The allowlist binds the `BarcodeDetector` path directly, and the zxing
 * fallback via POSSIBLE_FORMATS hints (see CameraScanner). Before this module
 * existed the zxing path took no hints at all, so iOS silently decoded every
 * symbology zxing supports — including retail barcodes — at gates. These sets
 * are what make the two platforms agree.
 *
 * Symbologies without a mandatory integrity check (code_39 without mod-43,
 * codabar, and especially itf — continuous, any even digit count is
 * structurally valid, so a partial scan yields a shorter VALID code) are
 * listed in UNVERIFIED_1D and require N-of-M agreement before they are
 * emitted. `itf` additionally only appears in `pos`, where a GTIN check digit
 * validates it (see ./gtin).
 */

export const SCAN_MODES = ["access", "asset", "pos", "any"] as const;
export type ScanMode = (typeof SCAN_MODES)[number];

/**
 * Access: gates, credentials, tickets.
 * PDF417 is on driver's licences and most event tickets; Aztec is the transit
 * / ticketing standard. Deliberately NO 1D retail formats — a turnstile must
 * never accept a grocery item.
 */
const ACCESS_FORMATS = ["qr_code", "code_128", "pdf417", "aztec", "data_matrix"] as const;

/**
 * Asset: gear, fleet, lots.
 * Code 39 and Data Matrix dominate industrial/asset tagging. Code 39 is
 * acceptable here despite its optional check digit because asset tags are
 * org-issued and resolved against a table — an unknown tag fails closed.
 */
const ASSET_FORMATS = ["qr_code", "code_128", "code_39", "data_matrix"] as const;

/**
 * POS / receiving: the retail set.
 * ITF appears ONLY here (it is ITF-14 on cases) and only because every code
 * from these symbologies is GTIN check-digit validated before it means
 * anything.
 */
const POS_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "itf", "data_matrix", "qr_code"] as const;

/** Quick Scan: a lookup tool, not an authorization decision — union of the above. */
const ANY_FORMATS = [...new Set([...ACCESS_FORMATS, ...ASSET_FORMATS, ...POS_FORMATS])] as const;

export const SCAN_FORMATS: Record<ScanMode, readonly string[]> = {
  access: ACCESS_FORMATS,
  asset: ASSET_FORMATS,
  pos: POS_FORMATS,
  any: ANY_FORMATS,
};

/**
 * Symbologies carrying no mandatory check digit. A decode in one of these
 * must be seen twice before it is trusted (CameraScanner N-of-M confirm),
 * because a single misread is structurally indistinguishable from a good read.
 */
export const UNVERIFIED_1D = new Set<string>(["code_39", "codabar", "itf"]);

/** True when a decoded `format` needs N-of-M confirmation before emitting. */
export function needsConfirmation(format: string | undefined): boolean {
  return format ? UNVERIFIED_1D.has(format) : false;
}

/** Formats for a mode, defaulting to the full union. */
export function formatsForMode(mode: ScanMode = "any"): readonly string[] {
  return SCAN_FORMATS[mode] ?? SCAN_FORMATS.any;
}

/** Symbologies that carry a retail GTIN rather than an org-issued code. */
const RETAIL_FORMATS = new Set<string>(["ean_8", "ean_13", "upc_a", "upc_e", "itf"]);

/**
 * True when a decode must NOT be resolved on this surface.
 *
 * The only rule today: a retail barcode may never resolve on an `access`
 * surface. A turnstile that accepts an EAN-13 is a turnstile that accepts a
 * candy bar — entitlement codes are QR / Code128 / PDF417 / Aztec / DataMatrix,
 * never a grocery barcode.
 *
 * Enforced server-side as well as in the client's format allowlist, because the
 * allowlist is a UX affordance, not a security boundary: a stale tab, a queued
 * scan replayed by an older build, or a hand-rolled POST must all fail the same
 * way. An unknown/absent format is permitted — we only reject what we can
 * positively identify as out of scope.
 */
export function isOutOfScopeForMode(mode: ScanMode, format: string | undefined): boolean {
  if (mode !== "access") return false;
  return format ? RETAIL_FORMATS.has(format) : false;
}
