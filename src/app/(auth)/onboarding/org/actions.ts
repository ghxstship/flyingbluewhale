"use server";

import { redirect } from "next/navigation";
import { z, type ZodIssue } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { FormState } from "@/components/FormShell";

const Schema = z.object({
  name: z.string().min(1, "Workspace name is required").max(120),
});

function fieldErrors(issues: ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = i.path.join(".");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}

export async function createOrgAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Check the field below", fieldErrors: fieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/onboarding/org");
  }

  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: Array<{ org_id: string; org_slug: string }> | null; error: { message: string } | null }>
  )("create_org_with_owner", { p_name: parsed.data.name, p_slug: "" });

  if (error) {
    return { error: `Couldn't create workspace: ${error.message}` };
  }

  // E-17: stamp the plan intent captured at signup (`/signup?plan=`) onto the
  // new org's metadata. Best-effort — recorded intent only, never a tier or
  // billing change; a failure must not block workspace creation.
  const orgId = data?.[0]?.org_id;
  const pendingPlan = (userData.user?.user_metadata as { pending_plan?: string | null } | undefined)?.pending_plan;
  if (orgId && pendingPlan && ["free", "crew", "production", "festival"].includes(pendingPlan)) {
    try {
      const { data: orgRow } = await supabase.from("orgs").select("datamap").eq("id", orgId).maybeSingle();
      const datamap =
        orgRow && typeof orgRow.datamap === "object" && orgRow.datamap !== null && !Array.isArray(orgRow.datamap)
          ? (orgRow.datamap as Record<string, unknown>)
          : {};
      await supabase
        .from("orgs")
        .update({ datamap: { ...datamap, signup_plan_intent: pendingPlan, signup_plan_intent_at: new Date().toISOString() } })
        .eq("id", orgId);
    } catch {
      // Recorded-intent write is advisory; ignore failures.
    }
  }

  // /auth/resolve will now find the fresh owner membership and route to /studio.
  redirect("/auth/resolve");
}
