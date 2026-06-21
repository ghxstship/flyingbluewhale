"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { scanAssignment, type ScanResult } from "@/lib/db/assignments";

export type ScanState =
  | { ok: true; result: ScanResult }
  | { ok: false; error: string }
  | null;

const Input = z.object({ code: z.string().trim().min(1, "Enter a code to scan.") });

/**
 * Resolve a manually-entered (or camera-decoded) scan code → assignment and
 * journal the attempt via `scanAssignment`. The lib re-scopes by org and writes
 * the audit row; we only surface the result to the field UI.
 */
export async function scanCode(_prev: ScanState, fd: FormData): Promise<ScanState> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid code." };
  }
  try {
    const result = await scanAssignment({
      orgId: session.orgId,
      scannerUserId: session.userId,
      code: parsed.data.code,
    });
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Scan failed." };
  }
}
