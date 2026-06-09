"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { getRequestFormatters } from "@/lib/i18n/request";

const Schema = z.object({
  shift_id: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export async function requestSwap(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) redirect("/m/shift/swap?error=invalid");

  const supabase = await createClient();
  const { data: shift } = await supabase
    .from("shifts")
    .select("id, starts_at, ends_at, venue:venue_id(name)")
    .eq("org_id", session.orgId)
    .eq("id", parsed.data!.shift_id)
    .maybeSingle();
  if (!shift) redirect("/m/shift/swap?error=not_found");

  // Duplicate guard — repeated submits (double-tap, back-button replay)
  // created one shift_swaps row + one admin notification storm each.
  const { data: existing } = await supabase
    .from("shift_swaps")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("shift_id", parsed.data!.shift_id)
    .eq("requested_by", session.userId)
    .eq("swap_state", "requested")
    .maybeSingle();
  if (existing) redirect("/m/shift?swap=requested");

  // Canonical record — shift_swaps carries the state machine. The
  // notification fan-out below stays so admins see the request before
  // they navigate to /console/workforce/shift-swaps.
  const { error } = await supabase.from("shift_swaps").insert({
    org_id: session.orgId,
    shift_id: parsed.data!.shift_id,
    requested_by: session.userId,
    reason: parsed.data!.reason,
    swap_state: "requested",
  });
  if (error) throw new Error(`Could not request swap: ${error.message}`);

  // Notify all admin/manager members of the org via service role.
  // .is("deleted_at", null) so we don't notify offboarded admins
  // who'll either bounce on the link (RLS denies them) or worse,
  // re-engage with the org through a stale membership row.
  //
  // Notification fan-out is best-effort — without the service-role key
  // (local dev), the swap request still persists; admins just don't
  // get the live ping and have to discover the request via the
  // /console/workforce/shift-swaps inbox on next visit.
  if (isServiceClientAvailable()) {
    const service = createServiceClient();
    const { data: admins } = await service
      .from("memberships")
      .select("user_id, role")
      .eq("org_id", session.orgId)
      .in("role", ["owner", "admin", "manager"])
      .is("deleted_at", null);

    const venue = (shift as unknown as { venue?: { name: string | null } | null }).venue?.name ?? "venue TBD";
    const startsAt = new Date((shift as { starts_at: string }).starts_at);
    const title = `Shift swap requested: ${venue}`;
    const fmt = await getRequestFormatters();
    const body = `${fmt.dateParts(startsAt, { weekday: "short", month: "short", day: "numeric" })} · ${parsed.data!.reason}`;

    const inserts = (admins ?? []).map((a) => ({
      org_id: session.orgId,
      user_id: a.user_id,
      title,
      body,
      href: "/console/workforce/shift-swaps",
    }));
    if (inserts.length > 0) {
      await service.from("notifications").insert(inserts);
    }
  }

  revalidatePath("/m/shift/swap");
  redirect("/m/shift?swap=requested");
}
