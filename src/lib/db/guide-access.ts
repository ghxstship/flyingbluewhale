import "server-only";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { generateCode, hashCode, codePrefix, normalizeCode } from "@/lib/guides/access-token";
import type { GuidePersona } from "@/lib/guides/types";

export type GuideAccessCode = {
  id: string;
  org_id: string;
  project_id: string;
  persona: GuidePersona;
  code_prefix: string;
  label: string | null;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  max_uses: number | null;
  use_count: number;
  last_used_at: string | null;
};

// ─── Console CRUD (org-scoped via RLS) ──────────────────────────────────────

export async function listAccessCodes(orgId: string, projectId: string): Promise<GuideAccessCode[]> {
  if (!orgId || !projectId) return [];
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await supabase
    .from("guide_access_codes")
    .select(
      "id, org_id, project_id, persona, code_prefix, label, created_by, created_at, expires_at, revoked_at, max_uses, use_count, last_used_at",
    )
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as GuideAccessCode[];
}

export async function createAccessCode(args: {
  orgId: string;
  projectId: string;
  persona: GuidePersona;
  label?: string | null;
  expiresAt?: string | null;
  maxUses?: number | null;
  createdBy?: string | null;
}): Promise<{ code: GuideAccessCode; plainCode: string }> {
  const plain = generateCode();
  const hash = await hashCode(plain);
  const prefix = codePrefix(plain);
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await supabase
    .from("guide_access_codes")
    .insert({
      org_id: args.orgId,
      project_id: args.projectId,
      persona: args.persona,
      code_hash: hash,
      code_prefix: prefix,
      label: args.label ?? null,
      expires_at: args.expiresAt ?? null,
      max_uses: args.maxUses ?? null,
      created_by: args.createdBy ?? null,
    })
    .select(
      "id, org_id, project_id, persona, code_prefix, label, created_by, created_at, expires_at, revoked_at, max_uses, use_count, last_used_at",
    )
    .single();
  if (error) throw error;
  return { code: data as GuideAccessCode, plainCode: plain };
}

export async function revokeAccessCode(codeId: string): Promise<void> {
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase
    .from("guide_access_codes")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", codeId);
  if (error) throw error;
}

// ─── Anon-callable redemption (service role) ────────────────────────────────

export type RedeemFailure =
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "revoked" }
  | { ok: false; reason: "expired" }
  | { ok: false; reason: "exhausted" }
  | { ok: false; reason: "service_unavailable" };

export type RedeemSuccess = {
  ok: true;
  orgId: string;
  projectId: string;
  persona: GuidePersona;
  codeId: string;
};

type RedeemRpcRow = {
  ok_flag: boolean;
  reason_code: string | null;
  out_org_id: string | null;
  out_project_id: string | null;
  out_persona: GuidePersona | null;
  out_code_id: string | null;
};

/**
 * Redeem a code AND record the redemption atomically via a SECURITY DEFINER
 * RPC. Callable as anon — RLS on `guide_access_codes` would otherwise block
 * the lookup. The RPC bumps use_count and inserts the redemption row in the
 * same transaction so we can't end up with a cookie minted against a code we
 * didn't audit.
 */
export async function redeemAccessCode(args: {
  projectId: string;
  persona: GuidePersona;
  rawCode: string;
  jti: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<RedeemSuccess | RedeemFailure> {
  const hash = await hashCode(normalizeCode(args.rawCode));
  const sb = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = (await sb.rpc("redeem_guide_access_code", {
    p_project_id: args.projectId,
    p_persona: args.persona,
    p_code_hash: hash,
    p_jti: args.jti,
    p_ip: args.ip ?? null,
    p_user_agent: args.userAgent ?? null,
  })) as { data: RedeemRpcRow[] | RedeemRpcRow | null; error: unknown };
  if (error) return { ok: false, reason: "service_unavailable" };
  const row: RedeemRpcRow | null = Array.isArray(data) ? (data[0] ?? null) : data;
  if (!row) return { ok: false, reason: "not_found" };
  if (!row.ok_flag) {
    const r = row.reason_code;
    if (r === "revoked" || r === "expired" || r === "exhausted" || r === "not_found") {
      return { ok: false, reason: r };
    }
    return { ok: false, reason: "not_found" };
  }
  return {
    ok: true,
    orgId: row.out_org_id as string,
    projectId: row.out_project_id as string,
    persona: row.out_persona as GuidePersona,
    codeId: row.out_code_id as string,
  };
}

type RedemptionLogRow = {
  id: string;
  code_id: string;
  persona: GuidePersona;
  redeemed_at: string;
  ip: string | null;
  user_agent: string | null;
  code_label: string | null;
  code_prefix: string;
  org_id: string;
};

export async function listRedemptions(
  orgId: string,
  projectId: string,
  limit = 100,
): Promise<
  Array<{
    id: string;
    code_id: string;
    persona: GuidePersona;
    redeemed_at: string;
    ip: string | null;
    user_agent: string | null;
    code_label: string | null;
    code_prefix: string;
  }>
> {
  if (!orgId || !projectId) return [];
  if (!isServiceClientAvailable()) return [];
  const sb = createServiceClient() as unknown as LooseSupabase;
  const { data } = (await sb
    .from("guide_access_redemption_log")
    .select("id, code_id, persona, redeemed_at, ip, user_agent, code_label, code_prefix, org_id")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("redeemed_at", { ascending: false })
    .limit(limit)) as { data: RedemptionLogRow[] | null };
  return (data ?? []).map((r) => ({
    id: r.id,
    code_id: r.code_id,
    persona: r.persona,
    redeemed_at: r.redeemed_at,
    ip: r.ip,
    user_agent: r.user_agent,
    code_label: r.code_label,
    code_prefix: r.code_prefix,
  }));
}
