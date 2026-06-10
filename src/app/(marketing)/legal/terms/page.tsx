import { getRequestT } from "@/lib/i18n/request";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "The terms that govern your use of the ATLVS Technologies platform — accounts, acceptable use, billing, liability, and termination.",
  path: "/legal/terms",
});

export default async function TermsPage() {
  const { t } = await getRequestT();
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="hed-xl">{t("marketing.legal.terms.title", undefined, "Terms of Service")}</h1>
      <p className="mt-4 text-xs text-[var(--p-text-2)]">
        {t("marketing.legal.terms.lastUpdated", { date: "2026-04-16" }, "Last updated: {date}")}
      </p>
      <div className="mt-8 space-y-6 text-sm text-[var(--p-text-2)]">
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">
            {t("marketing.legal.terms.acceptance.heading", undefined, "1. Acceptance of Terms")}
          </h2>
          <p className="mt-2">
            {t(
              "marketing.legal.terms.acceptance.body",
              undefined,
              "By accessing or using the ATLVS Technologies platform you agree to these Terms. If you do not agree, do not use the Service.",
            )}
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">
            {t("marketing.legal.terms.accounts.heading", undefined, "2. Accounts")}
          </h2>
          <p className="mt-2">
            {t(
              "marketing.legal.terms.accounts.body",
              undefined,
              "You are responsible for safeguarding the credentials used to access your account and for any activity under your account.",
            )}
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">
            {t("marketing.legal.terms.billing.heading", undefined, "3. Subscription & Billing")}
          </h2>
          <p className="mt-2">
            {t(
              "marketing.legal.terms.billing.body",
              undefined,
              "Paid plans are billed via Stripe. Taxes, cancellation, and refund policies are documented in your in-app billing settings.",
            )}
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">
            {t("marketing.legal.terms.data.heading", undefined, "4. Data Ownership")}
          </h2>
          <p className="mt-2">
            {t(
              "marketing.legal.terms.data.body",
              undefined,
              "You own the content you upload. We process it solely to provide the Service. Export at any time from Settings → Compliance.",
            )}
          </p>
        </section>
        <section>
          <h2 className="text-base font-semibold text-[var(--p-text-1)]">
            {t("marketing.legal.terms.termination.heading", undefined, "5. Termination")}
          </h2>
          <p className="mt-2">
            {t(
              "marketing.legal.terms.termination.body",
              undefined,
              "Either party may terminate at any time. Your data remains exportable for 30 days post-termination.",
            )}
          </p>
        </section>
      </div>
    </div>
  );
}
