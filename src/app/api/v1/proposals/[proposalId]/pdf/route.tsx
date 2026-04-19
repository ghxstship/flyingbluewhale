import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { ProposalPdf } from "@/lib/pdf/proposal";
import { log } from "@/lib/log";

const ParamsSchema = z.object({ proposalId: z.string().uuid() });

const dynamic = "force-dynamic";
export { dynamic };

export async function GET(_req: Request, ctx: { params: Promise<{ proposalId: string }> }) {
  const { proposalId } = await ctx.params;
  const parsed = ParamsSchema.safeParse({ proposalId });
  if (!parsed.success) return apiError("bad_request", "Invalid proposal id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();
  const { data: p, error } = await supabase
    .from("proposals")
    .select(
      "id, org_id, client_id, doc_number, title, status, currency, amount_cents, deposit_percent, sent_at, signed_at, expires_at, version, notes, blocks",
    )
    .eq("id", parsed.data.proposalId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (error) return apiError("internal", error.message);
  if (!p) return apiError("not_found", "Proposal not found");

  const [{ data: org }, { data: client }, { data: sigs }] = await Promise.all([
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
    p.client_id ? supabase.from("clients").select("name").eq("id", p.client_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase
      .from("proposal_signatures")
      .select("signer_name, signer_email, signer_role, signature_hash, signed_at, signer_ip")
      .eq("proposal_id", p.id)
      .order("signed_at", { ascending: true }),
  ]);
  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client: client ?? null });

  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <ProposalPdf
          brand={brand}
          proposal={{
            doc_number: p.doc_number ?? null,
            title: p.title,
            status: p.status ?? null,
            currency: p.currency ?? "USD",
            amount_cents: Number(p.amount_cents),
            deposit_percent: p.deposit_percent ?? null,
            sent_at: p.sent_at ?? null,
            signed_at: p.signed_at ?? null,
            expires_at: p.expires_at ?? null,
            version: p.version ?? null,
            notes: p.notes ?? null,
          }}
          blocks={(p.blocks ?? []) as never}
          signatures={(sigs ?? []).map((s) => ({
            signer_name: s.signer_name ?? null,
            signer_email: s.signer_email ?? null,
            signer_role: s.signer_role ?? null,
            signature_hash: s.signature_hash ?? null,
            signed_at: s.signed_at ?? null,
            signer_ip: s.signer_ip ?? null,
          }))}
        />
      ),
      bucket: "proposals",
      path: `compiled/${session.orgId}/${p.id}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `proposal-${p.doc_number ?? p.id}.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("proposal.pdf.compile_failed", { id: p.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render proposal PDF");
  }
}
