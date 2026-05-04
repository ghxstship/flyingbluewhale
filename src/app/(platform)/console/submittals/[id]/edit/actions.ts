"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";

const Schema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  project_id: z.string().uuid(),
  spec_section: z.string().max(80).optional(),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  ball_in_court_id: z.string().uuid().optional().or(z.literal("")),
  status: z.enum([
    "draft",
    "submitted",
    "in_review",
    "approved",
    "approved_with_comments",
    "revise_resubmit",
    "rejected",
    "void",
    "closed",
  ]),
  due_at: z.string().optional(),
});

export type State = { error?: string; ok?: true } | null;

export async function updateSubmittal(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { id, ...patch } = parsed.data;
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("submittals", session.orgId, id, expectedUpdatedAt, {
    title: patch.title,
    project_id: patch.project_id,
    spec_section: patch.spec_section || null,
    vendor_id: patch.vendor_id || null,
    ball_in_court_id: patch.ball_in_court_id || null,
    status: patch.status,
    due_at: patch.due_at || null,
  } as never);
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Submittal not found." };
  }
  revalidatePath(`/console/submittals/${id}`);
  revalidatePath("/console/submittals");
  redirect(`/console/submittals/${id}`);
}
