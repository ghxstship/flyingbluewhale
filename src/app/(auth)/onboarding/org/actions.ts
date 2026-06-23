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

  const { error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: Array<{ org_id: string; org_slug: string }> | null; error: { message: string } | null }>
  )("create_org_with_owner", { p_name: parsed.data.name, p_slug: "" });

  if (error) {
    return { error: `Couldn't create workspace: ${error.message}` };
  }

  // /auth/resolve will now find the fresh owner membership and route to /studio.
  redirect("/auth/resolve");
}
