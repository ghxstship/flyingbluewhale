import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CTASection } from "@/components/marketing/CTASection";
import { buildMetadata } from "@/lib/seo";
import { COMMUNITY_LIST } from "@/lib/community";

// Static page — no dynamic data, no request-time reads. Pre-render at build
// and skip the streaming loading.tsx on client-side navigation.
export const dynamic = "force-static";

export const metadata: Metadata = buildMetadata({
  title: "Community — the production teams building on Second Star",
  description:
    "The festivals, tours, agencies, and fabrication shops running their production on ATLVS, GVTEWAY, and COMPVSS. Member stories, numbers, and what they actually ship.",
  path: "/community",
  keywords: ["production community", "event production teams", "Second Star Technologies community"],
  ogImageEyebrow: "Community",
  ogImageTitle: "Production teams running on Second Star.",
});

export default function CommunityPage() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Community", href: "/community" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">
          Community
        </div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
          Production teams, building in public.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          The festivals, tours, agencies, and fabrication shops running their
          shows on Second Star Technologies. Real workflows. Real numbers.
          Real receipts.
        </p>
      </section>

      {/* Community metric strip — lightweight trust signal on top of stories */}
      <section className="mx-auto max-w-6xl px-6 py-6">
        <div className="surface-raised grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          {[
            { value: "200+", label: "production teams" },
            { value: "1.4M+", label: "tickets scanned" },
            { value: "850+", label: "shows advanced" },
            { value: "34", label: "countries" },
          ].map((m) => (
            <div key={m.label}>
              <div className="text-2xl font-semibold tracking-tight text-[var(--org-primary)]">
                {m.value}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Member stories</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              What they were running before, what they switched, what measurably improved.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {COMMUNITY_LIST.map((c) => (
            <Link
              key={c.slug}
              href={`/community/${c.slug}`}
              className="surface-raised hover-lift flex flex-col p-6"
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {c.industry}
              </div>
              <div className="mt-3 text-lg font-semibold">{c.name}</div>
              <div className="mt-2 flex-1 text-sm text-[var(--text-secondary)]">{c.blurb}</div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {c.stats.slice(0, 2).map((s) => (
                  <div key={s.label} className="surface-inset p-3">
                    <div className="text-xl font-semibold tracking-tight text-[var(--org-primary)]">
                      {s.value}
                    </div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface-raised grid gap-6 p-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--org-primary)]">
              Join the roster
            </div>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">
              Your team, here.
            </h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Shipping real shows on Second Star Technologies? We&apos;re always
              looking to document new member stories. A short interview,
              anonymized numbers, your words.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
            <Link href="/contact?topic=community-story" className="btn btn-primary btn-md">
              Pitch a story
            </Link>
            <Link href="/signup" className="btn btn-ghost btn-md">
              Start free
            </Link>
          </div>
        </div>
      </section>

      <CTASection
        title="Be the next story"
        subtitle="Start free. Ship a show. We'll talk afterward."
      />
    </div>
  );
}
