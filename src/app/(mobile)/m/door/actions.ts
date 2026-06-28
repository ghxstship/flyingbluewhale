"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Box-office door redeem result — the shape of the `redeem_event_ticket` RPC
 * payload. The DB function returns `not_found` with no other fields, so
 * `ticket_id` / `holder` / `seat` are optional.
 */
export const DOOR_RESULTS = ["accepted", "duplicate", "refunded", "voided", "not_found"] as const;
export type DoorResult = (typeof DOOR_RESULTS)[number];

export type DoorScanRow = {
  result: DoorResult;
  ticketId?: string;
  holder?: string;
  seat?: string;
};

export type DoorScanState =
  | { ok: true; scan: DoorScanRow }
  | { ok: false; error: string }
  | null;

const Input = z.object({
  code: z.string().trim().min(1, "Enter a ticket code to scan."),
  gate: z.string().trim().optional(),
  location: z.string().trim().optional(),
});

function isDoorResult(value: unknown): value is DoorResult {
  return typeof value === "string" && (DOOR_RESULTS as readonly string[]).includes(value);
}

/**
 * Redeem an issued event ticket at the gate. Runs the `redeem_event_ticket`
 * RPC (SECURITY DEFINER, org-membership-checked inside the function), which
 * flips the ticket to `redeemed` on `accepted` and journals the attempt in
 * `event_ticket_scans`. The RPC owns the FSM — a stale tab cannot double-redeem
 * because the function re-reads the live ticket state.
 */
export async function redeemTicket(_prev: DoorScanState, fd: FormData): Promise<DoorScanState> {
  await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid code." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_event_ticket", {
    p_code: parsed.data.code,
    p_gate: parsed.data.gate || undefined,
    p_location: parsed.data.location || undefined,
  });
  if (error) {
    return { ok: false, error: error.message };
  }

  const payload = (data ?? {}) as Record<string, unknown>;
  const result = isDoorResult(payload.result) ? payload.result : "not_found";
  return {
    ok: true,
    scan: {
      result,
      ticketId: typeof payload.ticket_id === "string" ? payload.ticket_id : undefined,
      holder: typeof payload.holder === "string" ? payload.holder : undefined,
      seat: typeof payload.seat === "string" ? payload.seat : undefined,
    },
  };
}
