import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { withAuth, assertScope } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import { getDocTemplate } from "@/lib/documents/registry";
import { contractOf } from "@/lib/documents/contract";
import { resolveDocData, resolveDocBrand, supportsRecordBinding } from "@/lib/documents/resolvers";
import { renderDocHtml } from "@/lib/documents/render-html";
import type { OrgBrand, ClientBrand } from "@/components/documents/DocEngine";

/**
 * GET  /api/v1/documents/{docType} — the machine-readable data contract for a
 *      document type: its JSON Schema, a sample data object, and the flat list
 *      of merge-field paths. A 3rd-party integration reads this to know exactly
 *      what to POST. Gated by `documents:read`.
 *
 * POST /api/v1/documents/{docType} — generate the document. Body is either:
 *        { data }      arbitrary data object keyed by the contract paths
 *                      (external generation — works for ALL doc types), or
 *        { recordId }  bind an org-scoped record (internal generation — every
 *                      doc type is record-backed).
 *      Returns the rendered document HTML (`.doc-stage` markup, styled by the
 *      published `kit-documents.css`) plus the resolved data object. Gated by
 *      `documents:write`.
 *
 * Neither verb mutates state — POST is a pure render — so both are safe to
 * retry. RLS + `org_id` scoping confine record-binding to the caller's org.
 */

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ docType: string }> }) {
  const { docType } = await ctx.params;
  const template = getDocTemplate(docType);
  if (!template) return apiError("not_found", `Unknown document type "${docType}"`);
  return withAuth(async (session) => {
    const denied = assertScope(session, "documents:read");
    if (denied) return denied;
    return apiOk({ ...contractOf(template), recordBinding: supportsRecordBinding(docType) });
  });
}

const BodySchema = z
  .object({
    data: z.record(z.string(), z.unknown()).optional(),
    recordId: z.string().uuid().optional(),
    brand: z.enum(["atlvs", "co", "white"]).optional(),
    showMergeFields: z.boolean().optional(),
  })
  .refine((b) => b.data != null || b.recordId != null, {
    message: "Provide either `data` (external) or `recordId` (internal)",
  });

export async function POST(req: Request, ctx: { params: Promise<{ docType: string }> }) {
  const { docType } = await ctx.params;
  const template = getDocTemplate(docType);
  if (!template) return apiError("not_found", `Unknown document type "${docType}"`);

  const rl = await ratelimit({ key: keyFromRequest(req, "doc-generate"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Document generation rate limit reached");

  return withAuth(async (session) => {
    const denied = assertScope(session, "documents:write");
    if (denied) return denied;

    const parsed = await parseJson(req, BodySchema);
    if (parsed instanceof Response) return parsed;

    let data: Record<string, unknown> | undefined = parsed.data;
    let org: OrgBrand | undefined;
    let client: ClientBrand | undefined;

    if (parsed.recordId) {
      const supabase = await createClient();
      const bound = await resolveDocData(docType, supabase, session.orgId, parsed.recordId);
      if (!bound) return apiError("not_found", "Record not found");
      data = bound;
      const brand = await resolveDocBrand(supabase, session.orgId);
      org = brand.org;
      client = brand.client;
    }

    let html: string;
    try {
      html = renderDocHtml(template, {
        brand: parsed.brand ?? "atlvs",
        org,
        client,
        showMergeFields: parsed.showMergeFields ?? false,
        data,
      });
    } catch (e) {
      return apiError("internal", e instanceof Error ? e.message : "Render failed");
    }

    return apiOk({ id: docType, schema: template.schema, brand: parsed.brand ?? "atlvs", html, data: data ?? {} });
  });
}
