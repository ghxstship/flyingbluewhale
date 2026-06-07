import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, SITE } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.status.meta.title"),
    description: t("marketing.pages.status.meta.description"),
    path: "/status",
    keywords: ["ATLVS status", "ATLVS uptime", "ATLVS Technologies incidents", "platform health"],
    ogImageEyebrow: t("marketing.pages.status.meta.ogEyebrow"),
    ogImageTitle: t("marketing.pages.status.meta.ogTitle"),
  });
}

type ServiceRow = { name: string; descriptionKey: string; state: "operational" | "degraded" | "outage" };

const SERVICES: ServiceRow[] = [
  { name: "ATLVS", descriptionKey: "marketing.pages.status.services.atlvs", state: "operational" },
  { name: "GVTEWAY Portal", descriptionKey: "marketing.pages.status.services.gvteway", state: "operational" },
  { name: "COMPVSS Field", descriptionKey: "marketing.pages.status.services.compvss", state: "operational" },
  { name: "Marketing + Auth", descriptionKey: "marketing.pages.status.services.marketing", state: "operational" },
  { name: "Webhooks", descriptionKey: "marketing.pages.status.services.webhooks", state: "operational" },
  { name: "AI Assistant", descriptionKey: "marketing.pages.status.services.ai", state: "operational" },
  { name: "Stripe Connect", descriptionKey: "marketing.pages.status.services.stripe", state: "operational" },
];

const STATE_COLOR: Record<ServiceRow["state"], string> = {
  operational: "var(--success)",
  degraded: "var(--warning)",
  outage: "var(--p-danger)",
};

const STATE_LABEL_KEY: Record<ServiceRow["state"], string> = {
  operational: "marketing.pages.status.stateLabel.operational",
  degraded: "marketing.pages.status.stateLabel.degraded",
  outage: "marketing.pages.status.stateLabel.outage",
};

export default async function StatusPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.status.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.status.breadcrumbs.status"), href: "/status" },
  ];

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">{t("marketing.pages.status.hero.eyebrow")}</div>
        <h1 className="hed-3xl mt-4">{t("marketing.pages.status.hero.title")}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--p-text-2)]">{t("marketing.pages.status.hero.body")}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--p-border)] bg-[var(--p-surface-2)] px-3 py-1.5">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: "var(--success)" }}
            aria-hidden="true"
          />
          <span className="text-xs font-medium">{t("marketing.pages.status.hero.badge")}</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface overflow-hidden">
          {SERVICES.map((s, i) => (
            <div
              key={s.name}
              className={`flex items-center justify-between p-5 ${i < SERVICES.length - 1 ? "border-b border-[var(--p-border)]" : ""}`}
            >
              <div>
                <div className="text-sm font-semibold">{s.name}</div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{t(s.descriptionKey)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: STATE_COLOR[s.state] }}
                  aria-hidden="true"
                />
                <span className="text-xs font-medium" style={{ color: STATE_COLOR[s.state] }}>
                  {t(STATE_LABEL_KEY[s.state])}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-8 md:p-10">
          <div className="eyebrow eyebrow-brand">{t("marketing.pages.status.comingSoon.eyebrow")}</div>
          <h2 className="hed-lg mt-3">{t("marketing.pages.status.comingSoon.title")}</h2>
          <p className="mt-3 text-sm text-[var(--p-text-2)]">
            {t("marketing.pages.status.comingSoon.body")}
            <span className="font-mono"> status.{SITE.domain}</span>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/contact" variant="secondary">
              {t("marketing.pages.status.comingSoon.cta")}
            </Button>
          </div>
        </div>
      </section>

      <CTASection title={t("marketing.pages.status.cta.title")} subtitle={t("marketing.pages.status.cta.subtitle")} />
    </div>
  );
}
