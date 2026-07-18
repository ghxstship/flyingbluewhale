/**
 * Positions/roles arrive from the API as snake_case enums — ALWAYS format for
 * the UI (kit 31, design_handoff_compvss_field/runtime/app.jsx:50; live-test
 * resolution #6). e.g. "stage_manager" → "Stage Manager". Already-formatted
 * strings pass through unchanged (words not starting lowercase are kept as-is,
 * so "AV Tech" or "OSHA-30" survive).
 */
export function fmtPosition(s: string | null | undefined): string {
  return String(s ?? "")
    .split(/[_]+/)
    .map((w) => (/^[a-z]/.test(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
