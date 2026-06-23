"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  code: z.string().min(1).max(40),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  priority: z.enum(["P1", "P2", "P3", "P4"]).default("P3"),
  workaround: z.string().max(4000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createProblem(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("itil_problems").insert({
    org_id: session.orgId,
    code: parsed.data.code,
    title: parsed.data.title,
    description: parsed.data.description || null,
    priority: parsed.data.priority,
    problem_state: "new",
    workaround: parsed.data.workaround || null,
    reporter_id: session.userId,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/ops/toc/problems");
  redirect("/studio/ops/toc/problems");
}
