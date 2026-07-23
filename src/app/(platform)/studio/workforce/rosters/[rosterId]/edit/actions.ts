"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  name: z.string().min(1).max(200),
  day_of: z.string().optional().or(z.literal("")),
  state: z.string(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateRoster(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("rosters", session.orgId, id, expectedUpdatedAt, {
    name: parsed.data.name,
    day_of: parsed.data.day_of,
    state: parsed.data.state as "draft" | "published" | "locked",
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : actionErrorMessage("not-found.roster", "Roster not found.") };
  }
  revalidatePath(`/studio/workforce/rosters/${id}`);
  revalidatePath("/studio/workforce/rosters");
  redirect(`/studio/workforce/rosters/${id}`);
}

export async function deleteRoster(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("rosters").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete roster: ${error.message}`);
  revalidatePath("/studio/workforce/rosters");
  redirect("/studio/workforce/rosters");
}
