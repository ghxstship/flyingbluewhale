"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

const Field = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "email", "url", "number", "date", "select", "checkbox"]),
  required: z.boolean().optional().default(false),
});
const SchemaShape = z.object({ fields: z.array(Field).max(100) });

export type SubmitState = { error?: string; ok?: true } | null;

export async function submitFormAction(slug: string, _: SubmitState, fd: FormData): Promise<SubmitState> {
  if (!isServiceClientAvailable()) return { error: "Form submissions are not configured." };
  const supabase = createServiceClient();

  // Lookup form by slug + published status.
  const { data: form, error: lookupErr } = await supabase
    .from("form_defs")
    .select("id, org_id, status, schema")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (lookupErr) return { error: lookupErr.message };
  if (!form) return { error: "Form not available." };

  const schema = SchemaShape.safeParse(form.schema);
  if (!schema.success) return { error: "Form schema invalid; cannot accept submissions." };

  // Coerce + validate fields against schema.
  const payload: Record<string, unknown> = {};
  for (const f of schema.data.fields) {
    const raw = fd.get(`f_${f.key}`);
    if (raw === null || raw === "") {
      if (f.required) return { error: `Field "${f.label}" is required.` };
      continue;
    }
    if (f.type === "number") {
      const n = Number(raw);
      if (!Number.isFinite(n)) return { error: `Field "${f.label}" must be a number.` };
      payload[f.key] = n;
    } else if (f.type === "checkbox") {
      payload[f.key] = raw === "on" || raw === "true";
    } else {
      const s = String(raw).slice(0, 5000);
      payload[f.key] = s;
    }
  }

  // Anti-spam — honeypot field that real users won't fill.
  if (fd.get("hp_url")) {
    // Pretend success — don't tip off bots.
    return { ok: true };
  }

  const submitterEmail =
    typeof payload["email"] === "string" && /@/.test(payload["email"] as string) ? (payload["email"] as string) : null;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const ua = h.get("user-agent") || null;

  const { error: insErr } = await supabase.from("form_submissions").insert({
    form_id: form.id,
    org_id: form.org_id,
    payload: payload as Json,
    submitter_email: submitterEmail,
    submitter_ip: ip,
    user_agent: ua,
  });
  if (insErr) return { error: `Submission failed: ${insErr.message}` };

  return { ok: true };
}
