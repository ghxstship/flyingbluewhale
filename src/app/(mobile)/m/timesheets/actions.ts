"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notifyManagersOfSubmission } from "./notify";
import { log } from "@/lib/log";

export type State = { error?: string; ok?: true } | null;

const Submit = z.object({ id: z.string().uuid() });

type LooseRpc = (
  name: string,
  params: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

/**
 * Submit my own timesheet (open|rejected → submitted).
 *
 * Goes through the `submit_timesheet` SECURITY DEFINER RPC, and there is no
 * plain-UPDATE fallback because a plain UPDATE cannot work: `timesheets` RLS
 * reserves UPDATE for the manager band (`utt_ts_admin_update`), so a worker
 * can insert a timesheet and read it and never change it. That is what made
 * the FSM's whole `open` branch dead code — `canSubmit()` existed, and
 * nothing could act on it.
 *
 * The RPC re-checks ownership and the submittable states server-side; this
 * action's job is to call it and tell the manager band a sheet arrived.
 */
export async function submitTimesheet(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Submit.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await (supabase.rpc as unknown as LooseRpc)("submit_timesheet", {
    p_timesheet_id: parsed.data.id,
  });
  if (error) {
    log.error("m.timesheets.submit_failed", { err: error.message });
    // The RPC's messages are already written for a human ("You can only
    // submit your own timesheet", "This timesheet is already approved") —
    // pass them through rather than flattening to a generic failure.
    return { error: error.message };
  }

  await notifyManagersOfSubmission(session, parsed.data.id);

  revalidatePath("/m/timesheets");
  revalidatePath("/m/my-work");
  return { ok: true };
}
