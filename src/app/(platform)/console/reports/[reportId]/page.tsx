import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport } from "@/lib/reports/registry";
import { resolveMetrics } from "@/lib/reports/resolvers";
import { resolveDocBrand } from "@/lib/documents/resolvers";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { formatDate } from "@/lib/i18n/format";
import { ReportToolbar } from "@/components/reports/ReportToolbar";

/**
 * Parametric report viewer (kit v6.3 `report-view.html?r=<id>`). Renders any of
 * the 43 reports from the registry, with metrics computed live from the
 * caller's org data and the org/client white-label brand applied. The same
 * markup is the print/PDF artifact (@media print in kit-reports.css).
 */
export const dynamic = "force-dynamic";

export default async function ReportViewPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = getReport(reportId);
  if (!report) notFound();

  const session = await requireSession();
  const supabase = await createClient();
  const [values, brand] = await Promise.all([
    resolveMetrics(session.orgId, report.metrics),
    resolveDocBrand(supabase, session.orgId),
  ]);
  const generatedAt = formatDate(new Date().toISOString());

  return (
    <div>
      <div className="mx-auto max-w-[1040px] px-6 pt-6 print:hidden">
        <Link
          href="/console/reports"
          className="font-mono text-[11px] tracking-wide text-[var(--p-text-3)] uppercase hover:text-[var(--p-accent-text)]"
        >
          ← Report library
        </Link>
      </div>
      <ReportToolbar report={report} values={values} org={brand.org} client={brand.client} generatedAt={generatedAt} />
    </div>
  );
}
