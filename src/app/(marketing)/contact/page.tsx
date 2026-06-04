// Static page — pre-render at build, no streaming Suspense on client nav.

import type { Metadata } from "next";
import { Mail, MessageCircle, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { buildMetadata, organizationSchema } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.contact.metadata.title"),
    description: t("marketing.pages.contact.metadata.description"),
    path: "/contact",
    keywords: ["ATLVS Technologies contact", "talk to sales", "production software demo", "book demo"],
    ogImageEyebrow: t("marketing.pages.contact.metadata.ogImageEyebrow"),
    ogImageTitle: t("marketing.pages.contact.metadata.ogImageTitle"),
  });
}

export default async function ContactPage() {
  const { t } = await getRequestT();

  const ROUTES = [
    {
      icon: Calendar,
      title: t("marketing.pages.contact.routes.walkthrough.title"),
      body: t("marketing.pages.contact.routes.walkthrough.body"),
      cta: t("marketing.pages.contact.routes.walkthrough.cta"),
      href: "#form",
    },
    {
      icon: Mail,
      title: t("marketing.pages.contact.routes.studio.title"),
      body: t("marketing.pages.contact.routes.studio.body"),
      cta: "sales@atlvs.pro",
      href: "mailto:sales@atlvs.pro",
    },
    {
      icon: MessageCircle,
      title: t("marketing.pages.contact.routes.concierge.title"),
      body: t("marketing.pages.contact.routes.concierge.body"),
      cta: "support@atlvs.pro",
      href: "mailto:support@atlvs.pro",
    },
    {
      icon: Building2,
      title: t("marketing.pages.contact.routes.partners.title"),
      body: t("marketing.pages.contact.routes.partners.body"),
      cta: "partners@atlvs.pro",
      href: "mailto:partners@atlvs.pro",
    },
  ];

  const FAQS = [
    {
      q: t("marketing.pages.contact.faqs.start.q"),
      a: t("marketing.pages.contact.faqs.start.a"),
    },
    {
      q: t("marketing.pages.contact.faqs.responseTime.q"),
      a: t("marketing.pages.contact.faqs.responseTime.a"),
    },
    {
      q: t("marketing.pages.contact.faqs.producer.q"),
      a: t("marketing.pages.contact.faqs.producer.a"),
    },
    {
      q: t("marketing.pages.contact.faqs.location.q"),
      a: t("marketing.pages.contact.faqs.location.a"),
    },
  ];

  const crumbs = [
    { label: t("marketing.pages.contact.breadcrumbs.home"), href: "/" },
    { label: t("marketing.pages.contact.breadcrumbs.contact"), href: "/contact" },
  ];

  return (
    <div>
      <JsonLd data={[organizationSchema()]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          {t("marketing.pages.contact.hero.eyebrow")}
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
          {t("marketing.pages.contact.hero.title")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          {t("marketing.pages.contact.hero.bodyPrefix")}{" "}
          <a className="underline" href="/signup">
            {t("marketing.pages.contact.hero.signupLabel")}
          </a>
          {t("marketing.pages.contact.hero.bodySuffix")}
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 md:grid-cols-2">
          {ROUTES.map(({ icon: Icon, title, body, cta, href }) => (
            <a key={title} href={href} className="surface hover-lift flex items-start gap-4 p-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--org-primary)]/10 text-[var(--org-primary)]">
                <Icon size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{body}</p>
                <div className="mt-2 font-mono text-xs text-[var(--org-primary)]">{cta}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="form" className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("marketing.pages.contact.form.heading")}
        </h2>
        <form className="surface mt-8 space-y-4 p-6" method="post" action="mailto:sales@atlvs.pro">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("marketing.pages.contact.form.fields.name")}
              <input name="name" required className="input-base mt-1.5 w-full" />
            </label>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("marketing.pages.contact.form.fields.email")}
              <input name="email" type="email" required className="input-base mt-1.5 w-full" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("marketing.pages.contact.form.fields.company")}
              <input name="company" className="input-base mt-1.5 w-full" />
            </label>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("marketing.pages.contact.form.fields.scale")}
              <select name="scale" className="input-base mt-1.5 w-full">
                <option>1–5</option>
                <option>6–20</option>
                <option>21–50</option>
                <option>50+</option>
              </select>
            </label>
          </div>
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            {t("marketing.pages.contact.form.fields.vertical")}
            <select name="vertical" className="input-base mt-1.5 w-full">
              <option>{t("marketing.pages.contact.form.verticals.liveEvents")}</option>
              <option>{t("marketing.pages.contact.form.verticals.touring")}</option>
              <option>{t("marketing.pages.contact.form.verticals.corporate")}</option>
              <option>{t("marketing.pages.contact.form.verticals.fabrication")}</option>
              <option>{t("marketing.pages.contact.form.verticals.other")}</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            {t("marketing.pages.contact.form.fields.message")}
            <textarea name="message" rows={4} className="input-base mt-1.5 w-full" />
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input type="checkbox" name="demo" /> {t("marketing.pages.contact.form.fields.demoOptIn")}
          </label>
          <div className="flex items-center justify-end gap-2">
            <Button href="/signup" variant="secondary">
              {t("marketing.pages.contact.form.actions.signupInstead")}
            </Button>
            <Button type="submit">{t("marketing.pages.contact.form.actions.submit")}</Button>
          </div>
        </form>
      </section>

      <FAQSection title={t("marketing.pages.contact.faqs.heading")} faqs={FAQS} />
    </div>
  );
}
