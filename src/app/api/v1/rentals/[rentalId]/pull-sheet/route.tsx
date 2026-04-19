import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { RentalPullSheetPdf } from "@/lib/pdf/reports";
import { log } from "@/lib/log";

/** GET /api/v1/rentals/{rentalId}/pull-sheet — Opportunity #25. */

const ParamsSchema = z.object({ rentalId: z.string().uuid() });

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ rentalId: string }> }) {
  const { rentalId } = await ctx.params;
  const p = ParamsSchema.safeParse({ rentalId });
  if (!p.success) return apiError("bad_request", "Invalid rental id");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const denial = assertCapability(session, "projects:read");
  if (denial) return denial;

  const supabase = await createClient();
  const { data: r, error } = await supabase
    .from("rentals")
    .select("id, equipment_id, starts_at, ends_at, notes")
    .eq("id", p.data.rentalId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (error || !r) return apiError("not_found", "Rental not found");

  const { data: equipment } = r.equipment_id
    ? await supabase.from("equipment").select("name, serial").eq("id", r.equipment_id).maybeSingle()
    : { data: null };
  const { data: org } = await supabase
    .from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle();
  if (!org) return apiError("internal", "Missing organization row");

  const brand = resolvePdfBrand({ org, client: null });
  const shortId = r.id.slice(0, 8);
  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <RentalPullSheetPdf
          brand={brand}
          rental={{
            number: shortId,
            vendor_name: null,
            starts_on: typeof r.starts_at === "string" ? r.starts_at.slice(0, 10) : null,
            ends_on: typeof r.ends_at === "string" ? r.ends_at.slice(0, 10) : null,
          }}
          lineItems={equipment
            ? [{ qty: 1, item: equipment.name ?? "Rental item", serial: equipment.serial ?? null, note: r.notes ?? null }]
            : [{ qty: 1, item: "Rental (equipment TBD)", serial: null, note: r.notes ?? null }]}
        />
      ),
      bucket: "advancing",
      path: `rentals/${session.orgId}/${r.id}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `rental-${shortId}.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("rental_pull.compile_failed", { rental_id: r.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render rental pull sheet");
  }
}
