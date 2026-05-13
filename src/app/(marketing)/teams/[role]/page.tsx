import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { Button } from "@/components/ui/Button";
import { buildMetadata, breadcrumbSchema, faqSchema, CANONICAL_CTAS, SITE } from "@/lib/seo";
import { TEAMS, TEAMS_BY_SLUG } from "@/lib/marketing/teams";
import { MODULES } from "@/lib/marketing/modules";
import { INDUSTRIES } from "@/lib/marketing/industries";

export function generateStaticParams() {
  return TEAMS.map((t) => ({ role: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ role: string }> }): Promise<Metadata> {
  const { role } = await params;
  const t = TEAMS_BY_SLUG[role];
  if (!t) return buildMetadata({ title: "Teams", description: SITE.description, path: `/teams/${role}` });
  return buildMetadata({
    title: `${t.role} — ${t.hero.title}`,
    description: t.blurb,
    path: `/teams/${t.slug}`,
    keywords: [
      `${t.role.toLowerCase()} software`,
      `software for ${t.role.toLowerCase()}`,
      `${t.role.toLowerCase()} platform`,
      `production software for ${t.role.toLowerCase()}`,
    ],
    ogImageEyebrow: t.hero.eyebrow,
    ogImageTitle: t.role,
  });
}

export default async function TeamRolePage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const t = TEAMS_BY_SLUG[role];
  if (!t) notFound();

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Built For", href: "/teams" },
    { label: t.role, href: `/teams/${t.slug}` },
  ];

  const sibling = TEAMS.filter((o) => o.slug !== t.slug);

  return (
    <div>
      <JsonLd data={[breadcrumbSchema(crumbs), faqSchema(t.faqs)]} />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          {t.hero.eyebrow}
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-balance sm:text-6xl">{t.hero.title}</h1>
        <p className="mt-5 max-w-3xl text-lg text-[var(--text-secondary)]">{t.hero.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
          <Button href={CANONICAL_CTAS.secondary.href} variant="secondary">
            {CANONICAL_CTAS.secondary.label}
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">What {t.role} Run Day-To-Day.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {t.workflows.map((w) => (
            <div key={w.title} className="surface p-6">
              <div className="text-sm font-semibold">{w.title}</div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {t.painPoints.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <div className="surface p-8 md:p-10">
            <div className="text-xs font-semibold tracking-[0.2em] text-[var(--org-primary)] uppercase">Familiar?</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">The Pain You're Working Around.</h2>
            <ul className="mt-6 space-y-3 text-sm">
              {t.painPoints.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <span className="status-dot status-dot-error mt-2" />
                  <span className="text-[var(--text-secondary)]">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Modules You Live In.</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {t.modules
            .map((m) => MODULES[m])
            .filter((m): m is NonNullable<typeof m> => Boolean(m))
            .map((m) => (
              <Link
                key={m.slug}
                href={`/features/${m.slug}`}
                className="surface hover-lift group flex items-center justify-between p-4 text-sm"
              >
                <span className="font-medium">{m.name}</span>
                <ArrowRight size={14} className="cta-nudge text-[var(--text-muted)]" />
              </Link>
            ))}
        </div>
      </section>

      {t.industries.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-semibold tracking-tight">Industries You Work In.</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {t.industries
              .map((s) => ({ slug: s, info: INDUSTRIES[s] }))
              .filter((x): x is { slug: string; info: NonNullable<(typeof INDUSTRIES)[string]> } => Boolean(x.info))
              .map((x) => (
                <Link
                  key={x.slug}
                  href={`/solutions/${x.slug}`}
                  className="surface hover-lift group flex items-center justify-between p-4 text-sm"
                >
                  <span className="font-medium">{x.info.name}</span>
                  <ArrowRight size={14} className="cta-nudge text-[var(--text-muted)]" />
                </Link>
              ))}
          </div>
        </section>
      ) : null}

      {t.faqs.length > 0 ? <FAQSection title={`${t.role} · FAQ`} faqs={t.faqs} /> : null}

      <CTASection
        title={`Run ${t.role}' Workflow On ATLVS.`}
        subtitle="Free for small teams. Per-org pricing the rest of the way up."
      />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Other Roles.</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {sibling.map((s) => (
            <Link
              key={s.slug}
              href={`/teams/${s.slug}`}
              className="surface hover-lift group flex items-center justify-between p-4 text-sm"
            >
              <span className="font-medium">{s.role}</span>
              <ArrowRight size={14} className="cta-nudge text-[var(--text-muted)]" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
