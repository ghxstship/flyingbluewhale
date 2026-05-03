"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

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
  status: z.enum(["draft", "published", "archived"]),
  schema_json: z.string().min(2),
});

export type State = { error?: string; ok?: true } | null;

export async function updateFormDefAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse({
    formId: fd.get("formId"),
    title: fd.get("title"),
    slug: fd.get("slug"),
    description: fd.get("description") || undefined,
    status: fd.get("status"),
    schema_json: fd.get("schema_json"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

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

  const supabase = await createClient();
  const { error } = await supabase
    .from("form_defs")
    .update({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description || null,
      status: parsed.data.status,
      schema: parsedSchema,
    })
    .eq("id", parsed.data.formId)
    .eq("org_id", session.orgId);

  if (error) return { error: error.message };

  revalidatePath(`/console/forms/${parsed.data.formId}`);
  revalidatePath("/console/forms");
  redirect(`/console/forms/${parsed.data.formId}`);
}

export async function deleteFormDefAction(formId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("form_defs").delete().eq("id", formId).eq("org_id", session.orgId);
  revalidatePath("/console/forms");
  redirect("/console/forms");
}
