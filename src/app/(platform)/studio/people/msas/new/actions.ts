"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createMsaDraft } from "@/lib/msa/mutations";

export type State = { error?: string } | null;

export async function createMsa(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const crewMemberId = String(fd.get("crew_member_id") ?? "").trim();
  if (!crewMemberId) return { error: "Pick a crew member." };
  try {
    const id = await createMsaDraft(session.orgId, crewMemberId);
    redirect(`/studio/people/msas/${id}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create MSA." };
  }
}
