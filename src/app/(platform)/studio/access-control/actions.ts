"use server";

import { requireSession } from "@/lib/auth";
import { scanAssignment, type ScanResult } from "@/lib/db/assignments";

export type VerifyAccessResult = { ok: true; result: ScanResult } | { ok: false; error: string };

/**
 * Console access-control verification. Resolves a scanned credential/ticket
 * code via `scanAssignment` (org-scoped, race-safe redeem, audit-journaled to
 * `assignment_events`) and returns the real gate verdict — never a blind grant.
 * The gate operator is the scanner; the resolver is kind-agnostic.
 */
export async function verifyAccessCode(code: string): Promise<VerifyAccessResult> {
  const session = await requireSession();
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: "Empty code." };
  try {
    const result = await scanAssignment({
      orgId: session.orgId,
      scannerUserId: session.userId,
      code: trimmed,
    });
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Scan failed." };
  }
}
