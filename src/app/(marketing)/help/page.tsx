// Static page — pre-render at build, no streaming Suspense on client nav.

import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Headset, LifeBuoy, MessageCircle, ShieldAlert, Sparkles, Wrench } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { FAQSection, type FAQ } from "@/components/marketing/FAQ";
import { buildMetadata, organizationSchema, SITE } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.help.metadata.title"),
    description: t("marketing.pages.help.metadata.description"),
    path: "/help",
    keywords: ["ATLVS help", "ATLVS support", "GVTEWAY support", "COMPVSS support", "event production software help"],
    ogImageEyebrow: t("marketing.pages.help.metadata.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.help.metadata.ogImageTitle"),
  });
}

export default async function HelpPage() {
  const { t } = await getRequestT();

  const CHANNELS = [
    {
      icon: BookOpen,
      title: t("marketing.pages.help.channels.fieldGuide.title"),
      body: t("marketing.pages.help.channels.fieldGuide.body"),
      cta: t("marketing.pages.help.channels.fieldGuide.cta"),
      href: "/docs",
    },
    {
      icon: Sparkles,
      title: t("marketing.pages.help.channels.changelog.title"),
      body: t("marketing.pages.help.channels.changelog.body"),
      cta: t("marketing.pages.help.channels.changelog.cta"),
      href: "/changelog",
    },
    {
      icon: MessageCircle,
      title: t("marketing.pages.help.channels.concierge.title"),
      body: t("marketing.pages.help.channels.concierge.body"),
      cta: "support@atlvs.pro",
      href: "mailto:support@atlvs.pro",
    },
    {
      icon: Headset,
      title: t("marketing.pages.help.channels.hotline.title"),
      body: t("marketing.pages.help.channels.hotline.body"),
      cta: t("marketing.pages.help.channels.hotline.cta"),
      href: "/contact",
    },
  ];

  const TROUBLESHOOTING = [
    {
      icon: ShieldAlert,
      title: t("marketing.pages.help.troubleshooting.signIn.title"),
      body: t("marketing.pages.help.troubleshooting.signIn.body"),
    },
    {
      icon: Wrench,
      title: t("marketing.pages.help.troubleshooting.webhook.title"),
      body: t("marketing.pages.help.troubleshooting.webhook.body"),
    },
    {
      icon: LifeBuoy,
      title: t("marketing.pages.help.troubleshooting.mobileOffline.title"),
      body: t("marketing.pages.help.troubleshooting.mobileOffline.body"),
    },
  ];

  const FAQS: FAQ[] = [
    {
      q: t("marketing.pages.help.faqs.reportBug.q"),
      a: t("marketing.pages.help.faqs.reportBug.a"),
    },
    {
      q: t("marketing.pages.help.faqs.statusPage.q"),
      a: t("marketing.pages.help.faqs.statusPage.a"),
    },
    {
      q: t("marketing.pages.help.faqs.phoneSupport.q"),
      a: t("marketing.pages.help.faqs.phoneSupport.a"),
    },
    {
      q: t("marketing.pages.help.faqs.invoice.q"),
      a: t("marketing.pages.help.faqs.invoice.a"),
    },
    {
      q: t("marketing.pages.help.faqs.cancel.q"),
      a: t("marketing.pages.help.faqs.cancel.a"),
    },
    {
      q: t("marketing.pages.help.faqs.lostAccess.q"),
      a: t("marketing.pages.help.faqs.lostAccess.a"),
    },
  ];

  const trail = [
    { label: t("marketing.pages.help.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.help.breadcrumbs.help"), href: "/help" },
  ];

  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: trail.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.label,
              item: `${SITE.baseUrl}${item.href}`,
            })),
          },
        ]}
      />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <Breadcrumbs items={trail} />
        <div className="mt-6 max-w-3xl">
          <div className="eyebrow eyebrow-brand">{t("marketing.pages.help.hero.eyebrow")}</div>
          <h1 className="hed-2xl mt-4">{t("marketing.pages.help.hero.title")}</h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--p-text-2)] sm:text-lg">
            {t("marketing.pages.help.hero.subtitle")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="hed-xl">{t("marketing.pages.help.sections.getHelp.title")}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {CHANNELS.map(({ icon: Icon, title, body, cta, href }) => (
            <Link key={title} href={href} className="surface hover-lift block p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--p-accent)]/10 text-[var(--p-accent)]">
                  <Icon size={18} />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="mt-3 text-sm text-[var(--p-text-2)]">{body}</p>
              <div className="mt-4 text-xs font-semibold text-[var(--p-accent)]">{cta} →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t("marketing.pages.help.sections.commonIssues.title")}</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {TROUBLESHOOTING.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface p-6">
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-[var(--p-accent)]" />
                <h3 className="text-base font-semibold">{title}</h3>
              </div>
              <p className="mt-3 text-sm text-[var(--p-text-2)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <FAQSection title={t("marketing.pages.help.faqSection.title")} faqs={FAQS} />

      <CTASection
        title={t("marketing.pages.help.cta.title")}
        subtitle={t("marketing.pages.help.cta.subtitle")}
        primaryLabel={t("marketing.pages.help.cta.primaryLabel")}
        primaryHref="mailto:support@atlvs.pro"
        secondaryLabel={t("marketing.pages.help.cta.secondaryLabel")}
        secondaryHref="/docs"
      />
    </>
  );
}
