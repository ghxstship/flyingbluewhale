"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formFail } from "@/lib/forms/fail";

const CATEGORY_VALUES = [
  "rigging",
  "fire",
  "electrical",
  "ada",
  "food_safety",
  "security",
  "foh",
  "medical",
  "sustainability",
  "custom",
] as const;

const Schema = z.object({
  code: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[A-Z0-9-]+$/, "code: uppercase letters, digits, dashes only"),
  name: z.string().min(1).max(200),
  category: z.enum(CATEGORY_VALUES),
  description: z.string().max(2000).optional(),
  // newline-separated prompts; we split + insert as inspection_template_items rows
  items: z.string().max(20000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createInspectionTemplateAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse({
    code: (fd.get("code") as string | null)?.toUpperCase(),
    name: fd.get("name"),
    category: fd.get("category"),
    description: fd.get("description") || undefined,
    items: fd.get("items") || undefined,
  });
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const { data: tpl, error: tplErr } = await supabase
    .from("inspection_templates")
    .insert({
      org_id: session.orgId,
      code: parsed.data.code,
      name: parsed.data.name,
      category: parsed.data.category,
      description: parsed.data.description || null,
      active: true,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (tplErr) return { error: tplErr.message };

  // Bulk insert items if provided.
  const promptLines = (parsed.data.items ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 200);

  if (promptLines.length > 0) {
    const rows = promptLines.map((prompt, i) => ({
      org_id: session.orgId,
      template_id: tpl.id,
      position: i,
      prompt,
      requires_photo: false,
      requires_note_on_fail: true,
    }));
    const { error: itemsErr } = await supabase.from("inspection_template_items").insert(rows);
    if (itemsErr) return { error: `Template created, but items failed: ${itemsErr.message}` };
  }

  revalidatePath("/console/inspections/templates");
  revalidatePath("/console/inspections");
  redirect(`/console/inspections/templates`);
}
