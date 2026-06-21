"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { scanAssignment, type ScanResult } from "@/lib/db/assignments";

export type CheckInState =
  | { ok: true; result: ScanResult }
  | { ok: false; error: string }
  | null;

const Input = z.object({
  code: z.string().trim().min(1, "Enter a code to scan."),
  mode: z.string().optional(),
  slug: z.string().optional(),
});

/**
 * Gate / asset / POS check-in scan. Resolves the code via `scanAssignment`
 * (org-scoped, audit-journaled). `mode` / `slug` are carried for UI context;
 * the resolver is mode-agnostic — the unified assignments domain handles all.
 */
export async function scanCode(_prev: CheckInState, fd: FormData): Promise<CheckInState> {
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
