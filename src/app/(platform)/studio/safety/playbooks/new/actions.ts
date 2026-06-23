"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

const Schema = z.object({
  slug: z.string().min(1).max(80).regex(SLUG_RE, "lowercase letters, digits, and dashes only"),
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional(),
  kind: z.enum(["crisis", "safety", "onboarding", "conops", "general"]).default("general"),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createPlaybook(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("playbooks").insert({
    org_id: session.orgId,
    slug: parsed.data.slug,
    title: parsed.data.title,
    summary: parsed.data.summary || null,
    kind: parsed.data.kind,
    playbook_state: "draft",
    version: 1,
    content: { sections: [] },
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/safety/playbooks");
  redirect("/studio/safety/playbooks");
}
