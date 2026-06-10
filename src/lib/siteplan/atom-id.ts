/**
 * SITEPLAN Atom Identifier — protocol §3.
 *
 * Format: {ORG}-{EVT}{YY}{VEN}-{CLASS}.{DIV}.{SEC}-{ZON}-{SEQ}{REV}
 * Example: SC-EDCLV26-LVMS-8000.800.002-KITPRP-001A
 *
 * The DB enforces well-formedness via a CHECK constraint
 * (site_plans_atom_id_format). This module is the authoritative
 * builder/parser/validator on the application side.
 */

import type { SitePlanSheetType } from "./types";

/** Mapping from sheet_type to the {SEC} 3-digit code per protocol §1. */
export const SHEET_TYPE_SEC: Record<SitePlanSheetType, string> = {
  site_plan: "001",
  floor_plan: "002",
  rcp: "003",
  power: "004",
  egress: "005",
  flow: "006",
  signage: "007",
  section: "008",
  as_built: "099",
};

/** {DIV} is fixed at 800 for all SITEPLAN sheets. */
export const SITEPLAN_DIV = "800";

/**
 * Authoritative regex matching the DB CHECK constraint.
 * Capture groups:
 *   1: ORG    (2-4 chars)
 *   2: EVT    (3-5 chars)
 *   3: YY     (2 digits)
 *   4: VEN    (3-5 chars)
 *   5: CLASS  (4 digits, e.g. 8000)
 *   6: DIV    (3 digits, always 800)
 *   7: SEC    (3 digits, sheet-type code)
 *   8: ZON    (4-8 chars)
 *   9: SEQ    (3 digits)
 *  10: REV    (1 upper letter)
 */
export const SITEPLAN_ATOM_ID_RE =
  /^([A-Z0-9]{2,4})-([A-Z0-9]{3,5})([0-9]{2})-([A-Z0-9]{3,5})-([0-9]{4})\.([0-9]{3})\.([0-9]{3})-([A-Z0-9]{4,8})-([0-9]{3})([A-Z])$/;

export type AtomIdParts = {
  org: string;
  evt: string;
  yy: string;
  ven: string;
  classCode: string; // 4-digit, e.g. "8000"
  div: string; // always "800"
  sec: string; // 3-digit sheet-type code
  zon: string;
  seq: string; // 3-digit
  rev: string; // single uppercase letter
};

/** Parse an atom-id string into its parts, or return null if malformed. */
export function parseAtomId(raw: string): AtomIdParts | null {
  const m = SITEPLAN_ATOM_ID_RE.exec(raw.trim());
  if (!m) return null;
  return {
    org: m[1]!,
    evt: m[2]!,
    yy: m[3]!,
    ven: m[4]!,
    classCode: m[5]!,
    div: m[6]!,
    sec: m[7]!,
    zon: m[8]!,
    seq: m[9]!,
    rev: m[10]!,
  };
}

/** Cheap predicate for forms/UIs that need an inline boolean. */
export function isAtomId(raw: string): boolean {
  return SITEPLAN_ATOM_ID_RE.test(raw.trim());
}

export type AtomIdInput = {
  org: string;
  evt: string;
  /** 2- or 4-digit year (4-digit gets truncated to 2). */
  year: number | string;
  ven: string;
  /** XPMS class 0..9 (we render as 4-digit padded "X000"). */
  primaryClass: number;
  sheetType: SitePlanSheetType;
  zon: string;
  /** 1..999. */
  seq: number;
  /** A..Z. */
  rev: string;
};

/**
 * Build a canonical atom-id from inputs. Throws on invalid input so callers
 * fail loudly — atom-id minting is a contract boundary, not a place for
 * silent fallbacks.
 */
export function buildAtomId(input: AtomIdInput): string {
  const org = normalizeSegment(input.org, "ORG", 2, 4);
  const evt = normalizeSegment(input.evt, "EVT", 3, 5);
  const yy = normalizeYear(input.year);
  const ven = normalizeSegment(input.ven, "VEN", 3, 5);
  const classCode = `${clampClass(input.primaryClass)}000`;
  const sec = SHEET_TYPE_SEC[input.sheetType];
  const zon = normalizeSegment(input.zon, "ZON", 4, 8);
  const seq = String(clampSeq(input.seq)).padStart(3, "0");
  const rev = normalizeRev(input.rev);

  const id = `${org}-${evt}${yy}-${ven}-${classCode}.${SITEPLAN_DIV}.${sec}-${zon}-${seq}${rev}`;
  if (!isAtomId(id)) {
    throw new Error(`siteplan: built atom id is malformed: ${id}`);
  }
  return id;
}

/**
 * Bump the {REV} letter of an existing atom-id (A→B, B→C, ...).
 * Throws on Z (revisions overflow — author should re-issue under a new SEQ).
 */
export function bumpRevision(atomId: string): string {
  const parts = parseAtomId(atomId);
  if (!parts) throw new Error(`siteplan: cannot bump malformed atom id: ${atomId}`);
  if (parts.rev === "Z") {
    throw new Error(`siteplan: revision Z reached — issue a new SEQ instead`);
  }
  const nextRev = String.fromCharCode(parts.rev.charCodeAt(0) + 1);
  return buildAtomId({
    org: parts.org,
    evt: parts.evt,
    year: parts.yy,
    ven: parts.ven,
    primaryClass: Number(parts.classCode[0]),
    sheetType: secToSheetType(parts.sec) ?? "site_plan",
    zon: parts.zon,
    seq: Number(parts.seq),
    rev: nextRev,
  });
}

/** Reverse the SHEET_TYPE_SEC map. */
export function secToSheetType(sec: string): SitePlanSheetType | null {
  for (const [k, v] of Object.entries(SHEET_TYPE_SEC)) {
    if (v === sec) return k as SitePlanSheetType;
  }
  return null;
}

// --- internal helpers ---

function normalizeSegment(raw: string, name: string, min: number, max: number): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length < min || cleaned.length > max) {
    throw new Error(`siteplan: ${name} must be ${min}-${max} alphanumeric chars (got "${raw}")`);
  }
  return cleaned;
}

function normalizeYear(year: number | string): string {
  const s = String(year);
  if (/^[0-9]{2}$/.test(s)) return s;
  if (/^[0-9]{4}$/.test(s)) return s.slice(2);
  throw new Error(`siteplan: year must be 2 or 4 digits (got "${year}")`);
}

function clampClass(c: number): number {
  if (!Number.isInteger(c) || c < 0 || c > 9) {
    throw new Error(`siteplan: primaryClass must be 0..9 (got ${c})`);
  }
  return c;
}

function clampSeq(seq: number): number {
  if (!Number.isInteger(seq) || seq < 1 || seq > 999) {
    throw new Error(`siteplan: seq must be 1..999 (got ${seq})`);
  }
  return seq;
}

function normalizeRev(rev: string): string {
  const r = rev.toUpperCase();
  if (!/^[A-Z]$/.test(r)) {
    throw new Error(`siteplan: rev must be a single A-Z letter (got "${rev}")`);
  }
  return r;
}
