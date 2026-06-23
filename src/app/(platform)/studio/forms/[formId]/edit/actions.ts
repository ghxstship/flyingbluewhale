"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

// Field shape stored on form_defs.schema. Kept narrow on purpose — adding
// new field kinds is a deliberate schema bump, not an open-ended free-for-all.
const FieldSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z][a-z0-9_]*$/, "key: lowercase letters, digits, underscore — must start with a letter"),
  label: z.string().min(1).max(200),
  type: z.enum(["text", "textarea", "email", "url", "number", "date", "select", "checkbox"]),
  required: z.boolean().optional().default(false),
  placeholder: z.string().max(200).optional(),
  options: z.array(z.string().min(1).max(80)).max(50).optional(), // for select
});

const SchemaJson = z.object({
  fields: z.array(FieldSchema).max(100),
});

const Schema = z.object({
  formId: z.string().uuid(),
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, digits, dashes only"),
  description: z.string().max(2000).optional(),
  form_state: z.enum(["draft", "published", "archived"]),
  schema_json: z.string().min(2),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateFormDefAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse({
    formId: fd.get("formId"),
    title: fd.get("title"),
    slug: fd.get("slug"),
    description: fd.get("description") || undefined,
    form_state: fd.get("form_state"),
    schema_json: fd.get("schema_json"),
  });
  if (!parsed.success) return formFail(parsed.error, fd);

  // Parse + validate the JSON schema body separately so we can give a useful error.
  let parsedSchema: Json;
  try {
    const raw = JSON.parse(parsed.data.schema_json);
    const v = SchemaJson.safeParse(raw);
    if (!v.success) return { error: `Schema invalid: ${v.error.issues[0]?.message}` };
    parsedSchema = v.data as Json;
  } catch (e) {
    return { error: `Schema is not valid JSON (${(e as Error).message})` };
  }

  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("form_defs", session.orgId, parsed.data.formId, expectedUpdatedAt, {
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    form_state: parsed.data.form_state,
    schema: parsedSchema,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Form Def not found." };
  }
  revalidatePath(`/studio/forms/${parsed.data.formId}`);
  revalidatePath("/studio/forms");
  redirect(`/studio/forms/${parsed.data.formId}`);
}

export async function deleteFormDefAction(formId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("form_defs").delete().eq("id", formId).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete form def: ${error.message}`);
  revalidatePath("/studio/forms");
  redirect("/studio/forms");
}
