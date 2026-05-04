"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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

  // Notify all admin/manager members of the org via service role.
  const service = createServiceClient();
  const { data: admins } = await service
    .from("memberships")
    .select("user_id, role")
    .eq("org_id", session.orgId)
    .in("role", ["owner", "admin", "manager"]);

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
    href: "/console/workforce/rosters",
  }));
  if (inserts.length > 0) {
    await service.from("notifications").insert(inserts);
  }

  revalidatePath("/m/shift/swap");
  redirect("/m/shift?swap=requested");
}
