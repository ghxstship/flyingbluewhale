"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Schema = z.object({
  id: z.string().uuid(),
  next_tier: z.enum(["submitted", "reviewing", "verified", "certified", "rejected"]),
  publish: z.enum(["now", "unpublish", "keep", "no"]),
  rejection_reason: z.string().max(1000).optional().or(z.literal("")),
});

export async function transitionTier(fd: FormData) {
  const session = await requireSession();
  // owner/admin gate. Without this, ANY authenticated user could flip
  // a partner_integrations row's certification tier because the
  // service-role client below bypasses RLS. The page-side guard isn't
  // enough — a hand-crafted POST hits this action directly.
  if (!isAdmin(session)) {
    throw new Error("Only owners and admins can transition integration tiers.");
  }
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");

  const supabase = createServiceClient() as unknown as LooseSupabase;

  // Cross-org guard: the row must belong to the actor's org. RLS would
  // catch it on a session client, but we're using service-role; this
  // is the only thing preventing a hand-crafted POST with another
  // org's id from succeeding.
  const { data: target } = await supabase
    .from("partner_integrations")
    .select("id, org_id")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!target || (target as { org_id: string }).org_id !== session.orgId) {
    throw new Error("Integration not found in your org.");
  }

  type Patch = {
    certification_tier: string;
    rejection_reason: string | null;
    reviewed_by: string;
    reviewed_at: string;
    published_at?: string | null;
  };
  const patch: Patch = {
    certification_tier: parsed.data.next_tier,
    rejection_reason: parsed.data.next_tier === "rejected" ? parsed.data.rejection_reason || null : null,
    reviewed_by: session.userId,
    reviewed_at: new Date().toISOString(),
  };
  if (parsed.data.publish === "now") patch.published_at = new Date().toISOString();
  else if (parsed.data.publish === "unpublish") patch.published_at = null;

  // Safety: never publish a submitted/reviewing/rejected row to the public
  // directory. The public-read RLS policy gates on (verified|certified)
  // already, but defense in depth.
  if (patch.published_at && !["verified", "certified"].includes(parsed.data.next_tier)) {
    patch.published_at = null;
  }

  // Belt-and-braces: re-assert org_id on the UPDATE so even if the
  // pre-check above is bypassed via a future code path, the write
  // cannot escape the actor's org.
  const { error } = await supabase
    .from("partner_integrations")
    .update(patch)
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(error.message);

  revalidatePath("/studio/settings/integrations/submissions");
  revalidatePath("/integrations/partners");
  redirect(`/studio/settings/integrations/submissions/${parsed.data.id}`);
}
