/**
 * GTIN normalization + check-digit validation.
 *
 * UPC-A (12), EAN-13 (13), EAN-8 (8) and ITF-14 (14) are the same number
 * space at different widths. A scan of the same bottle can arrive in any of
 * them depending on which symbology the camera happened to lock onto, so we
 * normalize to a single canonical form (GTIN-14, left-zero-padded) before the
 * value is ever used as a key. Without this, the same product misses its own
 * cache row depending on the barcode it was read from.
 *
 * The check digit is the reason this module exists. Every GTIN carries a
 * mod-10 check digit, and validating it locally is what makes the wider
 * symbology allowlist safe: ITF in particular has no mandatory integrity
 * check at the symbology level and a partial scan across a truncated bar
 * field decodes as a *shorter, structurally valid* code. Rejecting a bad
 * check digit at the edge stops a misread from reaching a resolver — or a
 * metered external lookup.
 *
 * Pure + dependency-free: safe on the client, trivially testable.
 */

/** Digits only, any of the four GTIN widths. */
const GTIN_WIDTHS = new Set([8, 12, 13, 14]);

/** Strip separators/whitespace a wedge scanner or a human might introduce. */
function digitsOnly(raw: string): string {
  return raw.replace(/[\s-]/g, "");
}

/**
 * Compute the mod-10 check digit for a GTIN body (the code *without* its
 * trailing check digit). Weights alternate 3,1,3,1… from the rightmost body
 * digit, which is why the body is reversed before weighting.
 */
export function gtinCheckDigit(body: string): number {
  let sum = 0;
  const reversed = body.split("").reverse();
  for (let i = 0; i < reversed.length; i++) {
    const d = Number(reversed[i]);
    sum += i % 2 === 0 ? d * 3 : d;
  }
  return (10 - (sum % 10)) % 10;
}

/** True when `code` is a well-formed GTIN-8/12/13/14 with a valid check digit. */
export function isValidGtin(code: string): boolean {
  const s = digitsOnly(code);
  if (!GTIN_WIDTHS.has(s.length)) return false;
  if (!/^\d+$/.test(s)) return false;
  const body = s.slice(0, -1);
  const check = Number(s.slice(-1));
  return gtinCheckDigit(body) === check;
}

/**
 * Expand a zero-suppressed UPC-E (8 digits incl. number system + check) to
 * its UPC-A (12) equivalent. UPC-E is a compression of UPC-A, not a separate
 * code — treating the two as distinct guarantees cache misses on the same
 * physical product.
 *
 * Returns null when `code` isn't a UPC-E we can expand (callers should then
 * treat the value as already-expanded, or as a non-GTIN).
 */
export function expandUpcE(code: string): string | null {
  const s = digitsOnly(code);
  if (s.length !== 8 || !/^\d+$/.test(s)) return null;
  const numberSystem = s[0];
  // Only number systems 0 and 1 are valid UPC-E.
  if (numberSystem !== "0" && numberSystem !== "1") return null;

  const d = s.slice(1, 7); // the 6 compressed digits
  const check = s[7];
  const lastDigit = d[5];
  let mfr: string;
  let item: string;

  switch (lastDigit) {
    case "0":
    case "1":
    case "2":
      mfr = `${d.slice(0, 2)}${lastDigit}00`;
      item = `00${d.slice(2, 5)}`;
      break;
    case "3":
      mfr = `${d.slice(0, 3)}00`;
      item = `000${d.slice(3, 5)}`;
      break;
    case "4":
      mfr = `${d.slice(0, 4)}0`;
      item = `0000${d[4]}`;
      break;
    default:
      // 5-9: manufacturer is the first 5 digits, item is the last digit.
      mfr = d.slice(0, 5);
      item = `0000${lastDigit}`;
      break;
  }

  return `${numberSystem}${mfr}${item}${check}`;
}

export type GtinNormalizeResult =
  | { ok: true; gtin14: string }
  | { ok: false; reason: "not_numeric" | "bad_length" | "bad_check_digit" };

/**
 * Normalize any GTIN-shaped code to GTIN-14, validating the check digit.
 *
 * Order matters: UPC-E is expanded to UPC-A *before* padding, because the
 * check digit of a UPC-E is the check digit of its expanded UPC-A form.
 */
export function normalizeGtin(raw: string): GtinNormalizeResult {
  const s = digitsOnly(raw);
  if (!/^\d+$/.test(s)) return { ok: false, reason: "not_numeric" };

  // UPC-E first: expand, then fall through to the common path.
  let candidate = s;
  if (s.length === 8) {
    const expanded = expandUpcE(s);
    // An 8-digit code that isn't a valid UPC-E may still be a real EAN-8.
    if (expanded && isValidGtin(expanded)) candidate = expanded;
  }

  if (!GTIN_WIDTHS.has(candidate.length)) return { ok: false, reason: "bad_length" };
  if (!isValidGtin(candidate)) return { ok: false, reason: "bad_check_digit" };

  return { ok: true, gtin14: candidate.padStart(14, "0") };
}

/** Symbologies whose decoded value is expected to be a GTIN. */
const GTIN_FORMATS = new Set(["ean_8", "ean_13", "upc_a", "upc_e", "itf"]);

/** True when a decoded `format` should be run through GTIN validation. */
export function isGtinFormat(format: string | undefined): boolean {
  return format ? GTIN_FORMATS.has(format) : false;
}

/**
 * Whether a well-formed code could EVER identify a product globally.
 *
 * This is the distinction that makes a miss queue useful. A scan that doesn't
 * resolve has two very different causes, and collapsing them is the classic
 * mistake:
 *
 *   "unresolved"   — a real, globally-unique GTIN that no database we consult
 *                    happens to carry. Worth recording, worth chasing, might
 *                    resolve later or via a manual add.
 *   "unresolvable" — a code that is not a global product identifier AT ALL.
 *                    There is no fact to look up. Retrying, crowd-sourcing, or
 *                    buying a product database will never resolve it.
 *
 * Per the GS1 General Specifications, restricted-circulation numbers "SHALL
 * NOT be used globally", "are NOT GTINs", and are "never unique if they leave
 * the restricted environment" — yet they are reserved inside the same numeric
 * ranges as GTINs, so they are indistinguishable by shape and pass the check
 * digit. Only the prefix tells you.
 *
 * Treating these as chaseable misses would fill the work queue with codes
 * nobody can ever action, and would corrupt the one number the queue exists to
 * produce: how many real retail codes we fail to resolve.
 */
export type GtinScope =
  | "global" // a normal GTIN; may or may not be in any database
  | "restricted" // retailer/company-internal (RCN). Not a global identifier.
  | "variable_measure" // price/weight embedded — a transaction artifact, not an identity
  | "foreign_namespace" // ISBN/ISSN/ISMN — a different registry entirely
  | "coupon"; // coupon / refund / demo ranges

export function classifyGtinScope(raw: string): GtinScope {
  const s = digitsOnly(raw);
  const g14 = s.length === 14 ? s : s.padStart(14, "0");
  // Strip the GTIN-14 indexer/packaging digit to read the underlying prefix.
  const body = g14.slice(1);
  const p2 = body.slice(0, 2);
  const p3 = body.slice(0, 3);

  // ISBN / ISSN / ISMN. GS1 has no product record — these identify a *title*
  // in another registry, not a package on a shelf.
  if (p3 === "977" || p3 === "978" || p3 === "979") return "foreign_namespace";
  // Coupons, refund receipts (value baked into the digits), demo stock.
  if (p3 === "980" || p3 === "981" || p3 === "982" || p3 === "983" || p3 === "952") return "coupon";
  if (p2 === "99") return "coupon";
  // Restricted circulation within a geography — retailer-assigned, meaning
  // varies by country (28 is kilograms in Germany, a priced item in the UK).
  // In the US, 02 is random-weight meat/deli: the digits encode a price or
  // weight for THAT package.
  if (p2 === "02") return "variable_measure";
  if (p2 >= "20" && p2 <= "29") return "variable_measure";
  // Company-internal ranges.
  if (body.startsWith("04") || body.startsWith("0000000")) return "restricted";

  return "global";
}

/**
 * True when no product database could ever resolve this code, so it should go
 * straight to manual entry rather than into the chase queue.
 */
export function isUnresolvableCode(raw: string): boolean {
  return classifyGtinScope(raw) !== "global";
}
