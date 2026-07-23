import { getRequestT } from "@/lib/i18n/request";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How ATLVS Technologies collects, uses, and protects your data: account info, workspace content, telemetry, retention, and your rights.",
  path: "/legal/privacy",
});

export default async function PrivacyPage() {
  const { t } = await getRequestT();
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="hed-xl">{t("marketing.legal.privacy.title", undefined, "Privacy Policy")}</h1>
      <p className="mt-4 text-xs text-[var(--p-text-2)]">
        {t("marketing.legal.privacy.lastUpdated", { date: "2026-04-16" }, "Last updated: {date}")}
      </p>
      <div className="mt-8 space-y-6 text-sm text-[var(--p-text-2)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">
            {t("marketing.legal.privacy.collect.heading", undefined, "What We Collect")}
          </h2>
          <p className="mt-2">
            {t(
              "marketing.legal.privacy.collect.body",
              undefined,
              "Account info, workspace content you upload, and operational telemetry (pageviews, errors, API timing).",
            )}
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">
            {t("marketing.legal.privacy.use.heading", undefined, "How We Use It")}
          </h2>
          <p className="mt-2">
            {t(
              "marketing.legal.privacy.use.body",
              undefined,
              "To run the Service, prevent abuse, and improve reliability. We do not sell customer data.",
            )}
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">
            {t("marketing.legal.privacy.subprocessors.heading", undefined, "Subprocessors")}
          </h2>
          <p className="mt-2">
            {t(
              "marketing.legal.privacy.subprocessors.body",
              undefined,
              "Supabase (hosting + database), Stripe (billing), Anthropic (AI), Vercel (edge + CDN).",
            )}
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">
            {t("marketing.legal.privacy.retention.heading", undefined, "Retention")}
          </h2>
          <p className="mt-2">
            {t(
              "marketing.legal.privacy.retention.body",
              undefined,
              "Default 90 days for audit logs; customer content retained until you delete it or your org is deleted.",
            )}
          </p>
        </section>
      </div>
    </div>
  );
}
