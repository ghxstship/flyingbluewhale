import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { AuditExportPdf } from "@/lib/pdf/audit-export";
import { log } from "@/lib/log";

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  actor: z.string().email().optional(),
});

const dynamic = "force-dynamic";
export { dynamic };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = QuerySchema.safeParse({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    actor: url.searchParams.get("actor") ?? undefined,
  });
  if (!q.success) return apiError("bad_request", "Invalid query parameters");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const denial = assertCapability(session, "projects:read");
  if (denial) return denial;

  const now = new Date();
  const rangeTo = q.data.to ?? now.toISOString();
  const rangeFrom = q.data.from ?? new Date(now.getTime() - 30 * 86_400_000).toISOString();

  const supabase = await createClient();
  let query = supabase
    .from("audit_log")
    .select("at, actor_email, action, target_table, target_id, operation, request_id")
    .eq("org_id", session.orgId)
    .gte("at", rangeFrom)
    .lte("at", rangeTo)
    .order("at", { ascending: true })
    .limit(10_000);
  if (q.data.actor) query = query.eq("actor_email", q.data.actor);
  const { data, error } = await query;
  if (error) return apiError("internal", error.message);

  const { data: org } = await supabase
    .from("orgs")
    .select("name, name_override, logo_url, branding")
    .eq("id", session.orgId)
    .maybeSingle();
  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client: null });
  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <AuditExportPdf
          brand={brand}
          rangeFrom={rangeFrom.slice(0, 10)}
          rangeTo={rangeTo.slice(0, 10)}
          actor={q.data.actor}
          rows={(data ?? []).map((r) => ({
            at: r.at as string,
            actor_email: r.actor_email ?? null,
            action: r.action,
            target_table: r.target_table ?? null,
            target_id: (r.target_id as string | null) ?? null,
            operation: r.operation ?? null,
            request_id: r.request_id ?? null,
          }))}
        />
      ),
      bucket: "exports",
      path: `${session.orgId}/audit-${rangeFrom.slice(0, 10)}-${rangeTo.slice(0, 10)}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `audit-${rangeFrom.slice(0, 10)}-${rangeTo.slice(0, 10)}.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("audit_export.compile_failed", { err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render audit export");
  }
}
