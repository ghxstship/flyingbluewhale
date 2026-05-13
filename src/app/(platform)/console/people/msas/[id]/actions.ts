"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { markMsaSent, revokeMsa } from "@/lib/msa/mutations";

export type State = { error?: string; ok?: true } | null;

export async function markSent(msaId: string, _prev: State, _fd: FormData): Promise<State> {
  const session = await requireSession();
  try {
    await markMsaSent(session.orgId, msaId);
    revalidatePath(`/console/people/msas/${msaId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not mark as sent." };
  }
}

export async function revokeAction(msaId: string, _prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const reason = String(fd.get("reason") ?? "").trim();
  if (reason.length < 4) return { error: "Provide a brief reason." };
  try {
    await revokeMsa(session.orgId, msaId, reason);
    revalidatePath(`/console/people/msas/${msaId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not revoke MSA." };
  }
}
