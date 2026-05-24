"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// SSO config is owner/admin-only — RLS gates writes, but pre-check at
// the action so unauthorized users don't waste a roundtrip to learn
// they can't write.

const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

function parseDomains(raw: string | undefined): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,\s]+/)
        .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
        .filter(Boolean)
        .filter((d) => DOMAIN_RE.test(d))
        .slice(0, 50),
    ),
  );
}

const UpsertSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(1).max(120),
  provider_type: z.enum(["saml", "oidc"]),
  supabase_id: z.string().trim().max(120).optional().or(z.literal("")),
  logout_url: z.string().url().max(500).optional().or(z.literal("")),
  email_domains: z.string().max(500).optional().or(z.literal("")),
  enabled: z.coerce.boolean().optional(),
});

export async function upsertSsoProvider(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isAdmin(session)) return;
  const parsed = UpsertSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  const id = parsed.data.id?.trim() || null;
  const payload = {
    org_id: session.orgId,
    provider_type: parsed.data.provider_type,
    name: parsed.data.name,
    supabase_id: parsed.data.supabase_id?.trim() || null,
    logout_url: parsed.data.logout_url || null,
    email_domains: parseDomains(parsed.data.email_domains),
    enabled: parsed.data.enabled ?? true,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    await supabase.from("org_sso_providers").update(payload).eq("id", id).eq("org_id", session.orgId);
  } else {
    await supabase.from("org_sso_providers").insert(payload);
  }

  revalidatePath("/console/settings/sso");
}

const ToggleSchema = z.object({
  id: z.string().uuid(),
  enabled: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export async function toggleSsoProvider(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isAdmin(session)) return;
  const parsed = ToggleSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("org_sso_providers")
    .update({ enabled: parsed.data.enabled, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId);

  revalidatePath("/console/settings/sso");
}

export async function deleteSsoProvider(id: string): Promise<void> {
  const session = await requireSession();
  if (!isAdmin(session)) return;
  if (!/^[0-9a-f-]{36}$/.test(id)) return;

  const supabase = await createClient();
  await supabase.from("org_sso_providers").delete().eq("id", id).eq("org_id", session.orgId);

  revalidatePath("/console/settings/sso");
}
