"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";

const Schema = z.object({
  title: z.string().min(1).max(200),
  role: z.string().min(1).max(100),
  venue: z.string().max(200).optional().or(z.literal("")),
  event_date: z.string().optional().or(z.literal("")),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  pay_rate: z.string().optional().or(z.literal("")),
  currency: z.string().regex(/^[A-Z]{3}$/).default("USD"),
  skills_required: z.string().max(400).optional().or(z.literal("")),
  max_claims: z.string().default("1"),
  notes: z.string().max(2000).optional().or(z.literal("")),
  project_id: z.string().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

const toCents = (v: string | undefined): number | null => {
  if (!v) return null;
  const n = Number(v.replace(/[$,]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};

const toArray = (v: string | undefined): string[] =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export async function createListingAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager+ required to post open shifts" };

  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("open_shift_listings")
    .insert({
      org_id: session.orgId,
      project_id: parsed.data.project_id || null,
      title: parsed.data.title,
      role: parsed.data.role,
      venue: parsed.data.venue || null,
      event_date: parsed.data.event_date || null,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      pay_rate_cents: toCents(parsed.data.pay_rate),
      currency: parsed.data.currency,
      skills_required: toArray(parsed.data.skills_required),
      max_claims: Math.max(1, parseInt(parsed.data.max_claims ?? "1", 10)),
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  const listingId = (data as { id: string }).id;

  // Notify all org members about the new open shift
  const { data: members } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .neq("user_id", session.userId);

  const targetIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
  if (targetIds.length > 0) {
    await sendPushBulk(targetIds, {
      title: "New open shift posted",
      body: `${parsed.data.role} — ${parsed.data.title}`,
      url: "/m/open-shifts",
      kind: "open_shift",
      scope: "mobile",
      orgId: session.orgId,
    });
  }

  revalidatePath("/console/workforce/open-shifts");
  redirect(`/console/workforce/open-shifts/${listingId}`);
}
