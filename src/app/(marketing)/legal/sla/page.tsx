import { getRequestT } from "@/lib/i18n/request";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Service Level Agreement",
  description:
    "The ATLVS Technologies SLA for the Enterprise tier — 99.9% monthly uptime target, service credits, and incident reporting.",
  path: "/legal/sla",
});

export default async function SlaPage() {
  const { t } = await getRequestT();
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="hed-xl">{t("marketing.legal.sla.title", undefined, "Service Level Agreement")}</h1>
      <p className="mt-4 text-xs text-[var(--p-text-2)]">
        {t("marketing.legal.sla.applies", { date: "2026-04-16" }, "Applies to Enterprise tier · effective {date}")}
      </p>
      <div className="mt-8 space-y-4 text-sm text-[var(--p-text-2)]">
        <p>
          {t("marketing.legal.sla.uptime.before", undefined, "We target")} <strong>99.9%</strong>{" "}
          {t(
            "marketing.legal.sla.uptime.after",
            undefined,
            "monthly uptime. Scheduled maintenance windows are excluded.",
          )}
        </p>
        <p>
          {t(
            "marketing.legal.sla.credits",
            undefined,
            "Service credits for missed SLA: 10% (99.0–99.9%), 25% (98.0–99.0%), 50% (below 98.0%).",
          )}
        </p>
        <p>
          {t("marketing.legal.sla.report.before", undefined, "Report incidents to")}{" "}
          <span className="font-mono">oncall@atlvs.pro</span>.
        </p>
      </div>
    </div>
  );
}
