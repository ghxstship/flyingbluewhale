import type { Metadata } from "next";
import { Mail, MessageCircle, Calendar, Building2 } from "lucide-react";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { buildMetadata, organizationSchema } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";
import { BRAND } from "@/lib/brand";
import { ContactForm } from "./ContactForm";

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

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; persona?: string; plan?: string }>;
}) {
  const { t } = await getRequestT();
  const sp = await searchParams;
  const topic = sp.topic === "walkthrough" || sp.topic === "festival" ? sp.topic : undefined;
  const persona = sp.persona?.slice(0, 60);
  const plan = sp.plan?.slice(0, 40);
  const walkthroughPreset =
    topic === "walkthrough"
      ? t(
          "marketing.pages.contact.form.walkthroughPreset",
          undefined,
          "I'd like a walkthrough of the platform for my team.",
        )
      : undefined;

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
      cta: BRAND.emails.support,
      href: `mailto:${BRAND.emails.support}`,
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

  return (
    <div>
      <JsonLd data={[organizationSchema()]} />
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-12">
        <div className="eyebrow eyebrow-accent">
          {t("marketing.pages.contact.hero.eyebrow")}
        </div>
        <h1 className="hed-3xl mt-3">
          {t("marketing.pages.contact.hero.title")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--p-text-2)]">
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--p-accent)]/10 text-[var(--p-accent)]">
                <Icon size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <p className="mt-1 text-sm text-[var(--p-text-2)]">{body}</p>
                <div className="mt-2 font-mono text-xs text-[var(--p-accent-text)]">{cta}</div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="form" className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="hed-xl">
          {topic === "walkthrough"
            ? t("marketing.pages.contact.form.walkthroughHeading", undefined, "Request a walkthrough")
            : t("marketing.pages.contact.form.heading")}
        </h2>
        <ContactForm topic={topic} persona={persona} plan={plan} initialMessage={walkthroughPreset} />
      </section>

      <FAQSection title={t("marketing.pages.contact.faqs.heading")} faqs={FAQS} />
    </div>
  );
}
