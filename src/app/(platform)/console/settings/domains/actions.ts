"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { promises as dns } from "node:dns";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const HOSTNAME = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

const AddSchema = z.object({
  hostname: z.string().regex(HOSTNAME, "Enter a valid hostname"),
  purpose: z.enum(["portal", "marketing", "email"]).default("portal"),
});

export type State = { error?: string } | null;

export async function addDomainAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = AddSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase.from("org_domains").insert({
    org_id: session.orgId,
    hostname: parsed.data.hostname.toLowerCase(),
    purpose: parsed.data.purpose,
  });
  if (error) return { error: error.message };
  revalidatePath("/console/settings/domains");
  return null;
}

/**
 * verifyDomainAction — runs a TXT lookup against `_atlvs-verify.<host>`
 * and accepts the domain if any record matches the verification token.
 * Modern hosting (Vercel, Cloudflare, Fly) all use this same dance.
 */
export async function verifyDomainAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("org_domains")
    .select("hostname, verification_token")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!row) return;
  let matched = false;
  try {
    const records = await dns.resolveTxt(`_atlvs-verify.${row.hostname}`);
    matched = records.flat().some((r) => r.includes(row.verification_token));
  } catch {
    matched = false;
  }
  if (matched) {
    await supabase
      .from("org_domains")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", id)
      .eq("org_id", session.orgId);
  }
  revalidatePath("/console/settings/domains");
}

export async function deleteDomainAction(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("org_domains").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/settings/domains");
}
