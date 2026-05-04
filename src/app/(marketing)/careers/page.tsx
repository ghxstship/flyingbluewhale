// Static page — pre-render at build, no streaming Suspense on client nav.
export const dynamic = "force-static";

import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Globe2, Heart, Layers, Rocket, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { CTASection } from "@/components/marketing/CTASection";
import { FAQSection } from "@/components/marketing/FAQ";
import { buildMetadata, organizationSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Careers — Build for Production",
  description:
    "We're a small studio shipping the operating system for live events. Open roles ship work that surfaces on real shows — measured in load-ins survived, not story points burned.",
  path: "/careers",
  keywords: [
    "LYTEHAUS careers",
    "event production platform jobs",
    "event tech startup careers",
    "remote engineering jobs",
    "design jobs production",
  ],
  ogImageEyebrow: "Careers",
  ogImageTitle: "Build for Production.",
});

const VALUES = [
  {
    icon: Layers,
    title: "Crew, not staff",
    body: "Small group, deep ownership. Every role touches every shell — marketing, console, portal, mobile.",
  },
  {
    icon: Compass,
    title: "Tested on the water",
    body: "We ship to real shows the weekend before each release. Bias to load-in survival over feature theater.",
  },
  {
    icon: Heart,
    title: "Pricing is an ethic",
    body: "Per org, not per seat. We hold that line internally — no token economies, no perf review caste system.",
  },
  {
    icon: Sparkles,
    title: "Brand-first engineering",
    body: "The platform reads like a magazine. Brutal where it should be, breathing where it can. Code follows.",
  },
  {
    icon: Globe2,
    title: "Distributed by default",
    body: "Studio in Miami, crew across timezones. Async-first. Travel for site visits and shows, not standups.",
  },
  {
    icon: Rocket,
    title: "Equity that means something",
    body: "Real ownership stake, four-year vest, ten-year exercise window. We pay competitively in cash too.",
  },
];

type Role = {
  title: string;
  team: string;
  location: string;
  type: "Full-time" | "Contract";
  body: string;
};

// Open roles get added here as the studio hires. Empty array renders the
// "no current openings" state, which is honest — better than ghost listings.
const ROLES: Role[] = [];

const FAQ = [
  {
    q: "Is the studio hiring right now?",
    a: "We're a small team and we hire deliberately. When we do open a role, it lands here first. If nothing's posted, it's truly closed — but we always read thoughtful intros at the contact link below.",
  },
  {
    q: "Do you sponsor visas?",
    a: "For senior engineering and design roles, yes — case by case. We'll be explicit on each posting whether sponsorship is on the table.",
  },
  {
    q: "Remote? Hybrid? In-office?",
    a: "Distributed by default. The Miami studio is open if you're nearby and want desk time, but no role requires you to be there.",
  },
  {
    q: "What's the interview process?",
    a: "Three calls: intro with a founder, working session with a peer (no whiteboard puzzles — we look at real work), and a paid trial week if both sides want to keep going.",
  },
  {
    q: "What do you NOT hire for?",
    a: 'Project managers, scrum coaches, and "head of" titles where the work is meetings. Engineering managers code; design leads design; founders sell.',
  },
];

export default function CareersPage() {
  const trail = [
    { label: "Home", href: "/" },
    { label: "Careers", href: "/careers" },
  ];

  return (
    <>
      <JsonLd
        data={[
          organizationSchema(),
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: trail.map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: t.label,
              item: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://lytehaus.tech"}${t.href}`,
            })),
          },
        ]}
      />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <Breadcrumbs items={trail} />
        <div className="mt-6 max-w-3xl">
          <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Careers</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">Build for Production.</h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
            We&apos;re building the platform the live-events industry has needed for fifteen years — one operating
            system that runs the producer&apos;s console, the crew&apos;s phone, and the client&apos;s portal off the
            same database. Small studio, deep ownership, real shows.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How We Crew</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--org-primary)]/10 text-[var(--org-primary)]">
                  <Icon size={18} />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Open Roles</h2>
          <span className="text-xs text-[var(--text-muted)]">Updated continuously</span>
        </div>

        {ROLES.length === 0 ? (
          <div className="surface mt-8 p-10 text-center">
            <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              No open roles right now
            </div>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--text-secondary)]">
              We hire deliberately and post openings here when they exist. If your background is unusual or specifically
              aligned with what we&apos;re building, we read every thoughtful intro that comes through the contact form.
            </p>
            <div className="mt-5">
              <Link href="/contact" className="btn btn-primary">
                Send a thoughtful intro
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-8 grid gap-3">
            {ROLES.map((r) => (
              <li key={r.title} className="surface p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                      {r.team} · {r.location} · {r.type}
                    </div>
                    <h3 className="mt-2 text-lg font-semibold">{r.title}</h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{r.body}</p>
                  </div>
                  <Link href="/contact" className="btn btn-secondary btn-sm shrink-0">
                    Apply
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <FAQSection title="Careers FAQ" faqs={FAQ} />

      <CTASection
        title="Not Listed? Tell Us Anyway."
        subtitle="If your background is unusual or specifically built for what we ship, write us. The studio reads every note."
        primaryLabel="Send a note"
        primaryHref="/contact"
        secondaryLabel="Read the about page"
        secondaryHref="/about"
      />
    </>
  );
}
