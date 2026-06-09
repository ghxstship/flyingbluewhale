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
  description: z.string().max(5000).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  likelihood: z.enum(["rare", "unlikely", "possible", "likely", "almost_certain"]),
  treatment: z.enum(["mitigate", "accept", "transfer", "avoid"]).default("mitigate"),
  classification: z.enum(["public", "internal", "confidential", "restricted"]).default("internal"),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createThreat(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("threats").insert({
    org_id: session.orgId,
    code: parsed.data.code,
    title: parsed.data.title,
    description: parsed.data.description || null,
    severity: parsed.data.severity,
    likelihood: parsed.data.likelihood,
    treatment: parsed.data.treatment,
    classification: parsed.data.classification,
    status: "active",
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/safety/threats");
  redirect("/console/safety/threats");
}
