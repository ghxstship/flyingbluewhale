"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { AGENT_OUTPUT_TYPES, AGENT_TARGET_TABLES } from "../constants";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  target_table: z.enum(AGENT_TARGET_TABLES),
  target_column: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9_]+$/, "lowercase letters, numbers, and underscores only"),
  source_columns: z.string().max(2000).optional(),
  prompt_template: z.string().min(1).max(8000),
  output_type: z.enum(AGENT_OUTPUT_TYPES).default("text"),
  enabled: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createAgentAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return actionFail(actionErrorMessage("not-authorized", "Not authorized"), fd);
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  // Source columns arrive as a comma/newline-separated string; normalize to
  // a clean text[] for the executor's `{{column}}` substitution.
  const sourceColumns = (parsed.data.source_columns ?? "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_agents")
    .insert({
      org_id: session.orgId,
      target_table: parsed.data.target_table,
      target_column: parsed.data.target_column,
      source_columns: sourceColumns,
      prompt_template: parsed.data.prompt_template,
      output_type: parsed.data.output_type,
      enabled: parsed.data.enabled === "true",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/ai/agents");
  redirect(`/studio/ai/agents/${data.id}`);
}
