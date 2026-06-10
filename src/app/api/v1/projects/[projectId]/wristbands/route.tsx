import { NextResponse } from "next/server";
import { z } from "zod";
import QRCode from "qrcode";
import { apiError } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { WristbandSheetPdf } from "@/lib/pdf/wristband-sheet";
import { log } from "@/lib/log";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * GET /api/v1/projects/{projectId}/wristbands — Opportunity #16.
 * Renders every active ticket-assignment on the project as a printable
 * QR wristband (10-up LETTER grid). QR encodes the assignment_scan_codes
 * value for gate-scan ingestion via /api/v1/scan.
 */

const ParamsSchema = z.object({ projectId: z.string().uuid() });

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const rl = await ratelimit({ key: keyFromRequest(req, "wristbands"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Wristband render rate limit reached");

  const { projectId } = await ctx.params;
  const p = ParamsSchema.safeParse({ projectId });
  if (!p.success) return apiError("bad_request", "Invalid project id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const denial = assertCapability(session, "projects:read");
  if (denial) return denial;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", p.data.projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return apiError("not_found", "Project not found");

  // Pull live ticket assignments + a holder name for printing. We resolve
  // names from three sources: the user row (party_kind='user'), the crew
  // member row, or the external holder row. The active scan code joins
  // through assignment_scan_codes.
  const [{ data: assignments }, { data: org }] = await Promise.all([
    supabase
      .from("assignments")
      .select(
        "id, party_kind, party_user_id, party_crew_id, party_external_id, title, ticket_assignment_details(tier_code), assignment_scan_codes!inner(code, active)",
      )
      .eq("org_id", session.orgId)
      .eq("project_id", project.id)
      .eq("catalog_kind", "ticket")
      .not("fulfillment_state", "in", "(voided,expired)")
      .eq("assignment_scan_codes.active", true)
      .is("deleted_at", null)
      .limit(500),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
  ]);
  if (!org) return apiError("internal", "Missing organization row");

  type Row = {
    id: string;
    party_kind: string;
    party_user_id: string | null;
    party_crew_id: string | null;
    party_external_id: string | null;
    title: string | null;
    ticket_assignment_details: { tier_code: string | null } | null;
    assignment_scan_codes: { code: string; active: boolean }[];
  };
  const rows = (assignments ?? []) as unknown as Row[];

  // Hydrate party names so the wristband prints something useful.
  const userIds = rows.filter((r) => r.party_user_id).map((r) => r.party_user_id!);
  const crewIds = rows.filter((r) => r.party_crew_id).map((r) => r.party_crew_id!);
  const extIds = rows.filter((r) => r.party_external_id).map((r) => r.party_external_id!);

  const [userRes, crewRes, extRes] = await Promise.all([
    userIds.length ? supabase.from("users").select("id, name, email").in("id", userIds) : Promise.resolve({ data: [] }),
    crewIds.length ? supabase.from("crew_members").select("id, name").in("id", crewIds) : Promise.resolve({ data: [] }),
    extIds.length
      ? supabase.from("assignment_external_holders").select("id, holder_name").in("id", extIds)
      : Promise.resolve({ data: [] }),
  ]);
  const userMap = new Map<string, string>(
    ((userRes.data ?? []) as Array<{ id: string; name: string | null; email: string }>).map((u) => [
      u.id,
      u.name ?? u.email,
    ]),
  );
  const crewMap = new Map<string, string>(
    ((crewRes.data ?? []) as Array<{ id: string; name: string }>).map((c) => [c.id, c.name]),
  );
  const extMap = new Map<string, string>(
    ((extRes.data ?? []) as Array<{ id: string; holder_name: string | null }>).map((e) => [
      e.id,
      e.holder_name ?? "Guest",
    ]),
  );

  const ticketRows = await Promise.all(
    rows
      .filter((r) => r.assignment_scan_codes.length > 0)
      .map(async (r) => {
        const code = r.assignment_scan_codes[0]!.code;
        const holderName =
          r.party_kind === "user"
            ? (userMap.get(r.party_user_id!) ?? null)
            : r.party_kind === "crew_member"
              ? (crewMap.get(r.party_crew_id!) ?? null)
              : (extMap.get(r.party_external_id!) ?? null);
        return {
          id: r.id,
          code,
          holderName,
          tier: r.ticket_assignment_details?.tier_code ?? null,
          qrDataUrl: await QRCode.toDataURL(code, { margin: 0, width: 144 }),
        };
      }),
  );

  const brand = resolvePdfBrand({ org, client: null });
  try {
    const { signedUrl } = await compileAndStore({
      doc: <WristbandSheetPdf brand={brand} eventName={project.name} tickets={ticketRows} />,
      bucket: "advancing",
      path: `wristbands/${session.orgId}/${project.id}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `${project.name.toLowerCase().replace(/\s+/g, "-")}-wristbands.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("wristband.compile_failed", { project_id: project.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render wristband sheet");
  }
}
