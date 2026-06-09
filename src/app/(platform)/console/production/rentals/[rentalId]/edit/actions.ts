"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { dateRangeRefine } from "@/lib/zod/dateRange";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

const Schema = z
  .object({
    starts_at: z.string().min(1),
    ends_at: z.string().min(1),
    rate_cents: z.string().optional(),
    notes: z.string().max(4000).optional().or(z.literal("")),
  })
  // Sea Trial R2 FINDING-018: a rental can't end before it starts.
  .refine(...dateRangeRefine("starts_at", "ends_at"));

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateRental(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("rentals", session.orgId, id, expectedUpdatedAt, {
    starts_at: new Date(parsed.data.starts_at).toISOString(),
    ends_at: new Date(parsed.data.ends_at).toISOString(),
    rate_cents: parsed.data.rate_cents ? Number(parsed.data.rate_cents) : null,
    notes: parsed.data.notes || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Rental not found." };
  }
  revalidatePath(`/console/production/rentals/${id}`);
  revalidatePath("/console/production/rentals");
  redirect(`/console/production/rentals/${id}`);
}
