import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { resolvePdfBrand } from "@/lib/pdf/branding";
import { compileAndStore } from "@/lib/pdf/render";
import { ExpenseReportPdf } from "@/lib/pdf/reports";
import { log } from "@/lib/log";

const ParamsSchema = z.object({ projectId: z.string().uuid() });
const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
});

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await ctx.params;
  const p = ParamsSchema.safeParse({ projectId });
  if (!p.success) return apiError("bad_request", "Invalid project id");
  const url = new URL(req.url);
  const q = QuerySchema.safeParse({ from: url.searchParams.get("from") ?? undefined, to: url.searchParams.get("to") ?? undefined });
  if (!q.success) return apiError("bad_request", "Invalid query parameters");

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;
  const denial = assertCapability(session, "expenses:read");
  if (denial) return denial;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", p.data.projectId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!project) return apiError("not_found", "Project not found");

  const rangeFrom = q.data.from ?? "1970-01-01";
  const rangeTo = q.data.to ?? new Date().toISOString().slice(0, 10);

  const [{ data: expenses }, { data: times }, { data: miles }, { data: org }] = await Promise.all([
    supabase.from("expenses").select("description, category, spent_at, amount_cents, currency").eq("project_id", project.id).gte("spent_at", rangeFrom).lte("spent_at", rangeTo),
    supabase.from("time_entries").select("duration_minutes, started_at, user_id").eq("project_id", project.id).gte("started_at", rangeFrom).lte("started_at", rangeTo),
    supabase.from("mileage_logs").select("miles, rate_cents, logged_on, user_id").eq("project_id", project.id).gte("logged_on", rangeFrom).lte("logged_on", rangeTo),
    supabase.from("orgs").select("name, name_override, logo_url, branding").eq("id", session.orgId).maybeSingle(),
  ]);
  if (!org) return apiError("internal", "Missing organization row");

  const expensesOut = (expenses ?? []).map((e) => ({
    description: e.description,
    category: e.category ?? null,
    date: e.spent_at ? String(e.spent_at).slice(0, 10) : null,
    amount_cents: Number(e.amount_cents),
  }));
  // time_entries stores duration_minutes only; no per-row rate today. The
  // report surfaces hours without a computed amount.
  const timesOut = (times ?? []).map((t) => ({
    user_name: null,
    hours: Number(t.duration_minutes) / 60,
    rate_cents: null,
    date: t.started_at ? String(t.started_at).slice(0, 10) : null,
  }));
  const milesOut = (miles ?? []).map((m) => ({
    user_name: null,
    miles: Number(m.miles),
    rate_per_mile_cents: m.rate_cents != null ? Number(m.rate_cents) : null,
    date: m.logged_on ? String(m.logged_on).slice(0, 10) : null,
  }));

  const totalCents =
    expensesOut.reduce((s, e) => s + e.amount_cents, 0) +
    milesOut.reduce((s, m) => s + (m.rate_per_mile_cents ? Math.round(m.miles * m.rate_per_mile_cents) : 0), 0);

  const currency = (expenses?.[0]?.currency as string | undefined) ?? "USD";
  const brand = resolvePdfBrand({ org, client: null });

  try {
    const { signedUrl } = await compileAndStore({
      doc: (
        <ExpenseReportPdf
          brand={brand}
          project={{ name: project.name }}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          expenses={expensesOut}
          time={timesOut}
          mileage={milesOut}
          totalCents={totalCents}
          currency={currency}
        />
      ),
      bucket: "receipts",
      path: `reports/${session.orgId}/${project.id}-${rangeFrom}-${rangeTo}.pdf`,
      signedUrlTtlSeconds: 60,
      contentDisposition: "attachment",
      filenameForAttachment: `${project.name.toLowerCase().replace(/\s+/g, "-")}-expenses-${rangeFrom}-${rangeTo}.pdf`,
    });
    return NextResponse.redirect(signedUrl, 302);
  } catch (e) {
    log.error("expense_report.compile_failed", { project_id: project.id, err: e instanceof Error ? e.message : String(e) });
    return apiError("internal", "Failed to render expense report");
  }
}
