import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ReportRow = {
  id: string;
  status: string;
  narrative: string;
  subject_ref: string | null;
  created_at: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  received: "muted",
  triage: "info",
  under_review: "warning",
  referred: "warning",
  closed: "success",
  rejected: "error",
};

export default async function SafeguardingPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("safeguarding_reports")
    .select("id, status, narrative, subject_ref, created_at")
    .eq("org_id", session.orgId)
    .eq("reporter_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(20);
  const reports = (data ?? []) as ReportRow[];

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-danger)] uppercase">
        {t("m.safeguarding.eyebrow", undefined, "Mobile")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.safeguarding.title", undefined, "Safeguarding")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t(
          "m.safeguarding.intro",
          undefined,
          "File a confidential disclosure. Reports route to the designated safeguarding lead and are retained for 10 years per statute.",
        )}
      </p>

      <div className="mt-5">
        <Link href="/console/safety/safeguarding/new" className="ps-btn ps-btn--danger w-full">
          {t("m.safeguarding.fileNew", undefined, "File new report")}
        </Link>
        <p className="mt-2 text-[10px] text-[var(--p-text-2)]">
          {t(
            "m.safeguarding.desktopOnlyHint",
            undefined,
            "The form is currently desktop-only. Mobile-native intake is on the roadmap.",
          )}
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("m.safeguarding.reportsFiledHeading", undefined, "Reports you've filed")}
        </h2>
        <ul className="mt-3 space-y-2">
          {reports.length === 0 ? (
            <li>
              <EmptyState
                size="compact"
                title={t("m.safeguarding.empty.title", undefined, "No Reports Filed")}
                description={t(
                  "m.safeguarding.empty.description",
                  undefined,
                  "Reports filed under your account appear here. Other reporters' reports are confidential.",
                )}
              />
            </li>
          ) : (
            reports.map((r) => (
              <li key={r.id} className="surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">
                    {fmt.dateParts(r.created_at, { month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-[var(--p-text-2)]">{r.narrative}</p>
                {r.subject_ref && (
                  <div className="mt-2 font-mono text-[10px] text-[var(--p-text-2)]">
                    {t("m.safeguarding.subjectLabel", undefined, "Subject:")} {r.subject_ref}
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
