"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
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
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");

  const supabase = createServiceClient() as unknown as LooseSupabase;

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

  const { error } = await supabase.from("partner_integrations").update(patch).eq("id", parsed.data.id);
  if (error) throw new Error(error.message);

  revalidatePath("/console/settings/integrations/submissions");
  revalidatePath("/integrations/partners");
  redirect(`/console/settings/integrations/submissions/${parsed.data.id}`);
}
