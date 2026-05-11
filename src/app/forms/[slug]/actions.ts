"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { coerceFormSchema } from "@/lib/forms/types";

const Field = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "email", "url", "tel", "number", "date", "select", "radio", "checkbox", "file"]),
  required: z.boolean().optional().default(false),
});
const SchemaShape = z.object({ fields: z.array(Field).max(100) });

export type SubmitState = { error?: string; ok?: true } | null;

async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // captcha not configured — accept (operator's responsibility to set the env)
  try {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const j = (await r.json()) as { success?: boolean };
    return Boolean(j.success);
  } catch {
    return false;
  }
}

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

  const v2 = coerceFormSchema(form.schema);
  const schema = SchemaShape.safeParse({ fields: v2.fields });
  if (!schema.success) return { error: "Form schema invalid; cannot accept submissions." };

  // Captcha verification — when the schema enables it.
  if (v2.antiSpam?.captcha) {
    const ok = await verifyTurnstile(fd.get("cf-turnstile-response")?.toString() ?? null);
    if (!ok) return { error: "Please complete the verification challenge." };
  }

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
    } else if (f.type === "file") {
      // Persist files to Supabase Storage; payload stores the storage path.
      // Each form gets its own bucket prefix: `form-uploads/<form_id>/<submission_id>/<key>-<filename>`.
      // For now we record the filename; an upload call follows below before the row insert.
      if (raw instanceof File) {
        if (raw.size > 10 * 1024 * 1024) return { error: `Field "${f.label}" must be 10 MB or smaller.` };
        // Closed MIME allowlist — anonymous public visitors can submit
        // here, so .html / .svg / .exe must NOT round-trip through the
        // forms bucket and back out via signed-URL preview links.
        const ALLOWED_FORM_MIME = new Set([
          "application/pdf",
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/heic",
          "image/heif",
          "image/gif",
          "text/plain",
          "text/csv",
          "application/zip",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ]);
        const mime = (raw.type || "").toLowerCase();
        if (mime && !ALLOWED_FORM_MIME.has(mime)) {
          return { error: `Field "${f.label}": unsupported file type ${mime}` };
        }
        const safeName = raw.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-200);
        const path = `form-uploads/${form.id}/${crypto.randomUUID()}/${f.key}-${safeName}`;
        const { error: upErr } = await supabase.storage.from("forms").upload(path, raw, {
          contentType: raw.type || "application/octet-stream",
          upsert: false,
        });
        if (upErr) return { error: `Upload failed for ${f.label}: ${upErr.message}` };
        payload[f.key] = { path, name: safeName, size: raw.size, type: raw.type };
      }
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
