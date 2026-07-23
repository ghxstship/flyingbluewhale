"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createMsaDraft } from "@/lib/msa/mutations";
import { actionErrorMessage } from "@/lib/errors";

export type State = { error?: string } | null;

export async function createMsa(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const crewMemberId = String(fd.get("crew_member_id") ?? "").trim();
  if (!crewMemberId) return { error: actionErrorMessage("pick-a-crew-member", "Pick a crew member.") };
  try {
    const id = await createMsaDraft(session.orgId, crewMemberId);
    redirect(`/studio/people/msas/${id}`);
  } catch (e) {
    // redirect() throws NEXT_REDIRECT — re-throw so the navigation isn't
    // swallowed as an error (which would strand the user on /new).
    if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) throw e;
    return { error: e instanceof Error ? e.message : "Could not create MSA." };
  }
}
