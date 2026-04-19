import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { CallSheetPdf } from "@/lib/pdf/call-sheet";
import { fetchWeather } from "@/lib/external/weather";
import { log } from "@/lib/log";

/**
 * GET /api/v1/projects/{projectId}/call-sheet?date=YYYY-MM-DD&variant=full|labor
 * Opportunity #6 (+ #13 labor variant).
 */

const ParamsSchema = z.object({ projectId: z.string().uuid() });
const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  variant: z.enum(["full", "labor"]).default("full"),
});

const dynamic = "force-dynamic";
export { dynamic };

export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const paramsParsed = ParamsSchema.safeParse({ projectId });
  if (!paramsParsed.success) return apiError("bad_request", "Invalid project id");
  const url = new URL(req.url);
  const queryParsed = QuerySchema.safeParse({
    date: url.searchParams.get("date") ?? undefined,
    variant: url.searchParams.get("variant") ?? "full",
  });
  if (!queryParsed.success) return apiError("bad_request", "Invalid query parameters");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const denial = assertCapability(session, "projects:read");
  if (denial) return denial;

  const forDate = queryParsed.data.date ?? new Date().toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", paramsParsed.data.projectId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!project) return apiError("not_found", "Project not found");

  // Window: forDate [00:00 UTC, next day 00:00 UTC). OK for MVP; tzs follow up.
  const day0 = new Date(`${forDate}T00:00:00.000Z`).toISOString();
  const day1 = new Date(new Date(day0).getTime() + 86_400_000).toISOString();

  const [{ data: events }, { data: crew }, { data: org }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, starts_at, ends_at, description, location_id")
      .eq("project_id", project.id)
      .gte("starts_at", day0)
      .lt("starts_at", day1)
      .order("starts_at", { ascending: true }),
    supabase
      .from("crew_members")
      .select("id, name, role, phone, email")
      .eq("org_id", session.orgId)
      .limit(200),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
  ]);

  if (!org) return apiError("internal", "Missing organization row");

  // Resolve the venue from the first event's location, if set.
  let venue: { name: string; address?: string | null; city?: string | null; region?: string | null } | null = null;
  let weather = null as { tempF: number; conditions: string } | null;
  const firstLoc = events?.find((e) => e.location_id)?.location_id as string | null | undefined;
  if (firstLoc) {
    const { data: loc } = await supabase
      .from("locations")
      .select("name, address, city, region, lat, lng")
      .eq("id", firstLoc)
      .maybeSingle();
    if (loc) {
      venue = { name: loc.name, address: loc.address, city: loc.city, region: loc.region };
      if (typeof loc.lat === "number" && typeof loc.lng === "number") {
        weather = await fetchWeather({ lat: Number(loc.lat), lng: Number(loc.lng), date: forDate });
      }
    }
  }

  const brand = resolvePdfBrand({ org, client: null });

  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <CallSheetPdf
          brand={brand}
          project={{ name: project.name }}
          forDate={forDate}
          weather={weather}
          venue={venue}
          events={(events ?? []).map((e) => ({
            name: e.name,
            starts_at: e.starts_at as string,
            ends_at: e.ends_at as string,
            location_name: null,
            description: e.description ?? null,
          }))}
          crew={(crew ?? []).map((c) => ({
            name: c.name,
            role: c.role ?? null,
            phone: c.phone ?? null,
            email: c.email ?? null,
          }))}
          variant={queryParsed.data.variant}
        />
      ),
      bucket: "advancing",
      path: `call-sheets/${session.orgId}/${project.id}/${forDate}-${queryParsed.data.variant}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `${project.name.toLowerCase().replace(/\s+/g, "-")}-${queryParsed.data.variant}-${forDate}.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("call_sheet.compile_failed", { project_id: project.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render call sheet");
  }
}
