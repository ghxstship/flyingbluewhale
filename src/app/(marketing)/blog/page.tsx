// ISR (H2-08 / IK-030) — regenerate static HTML every 5 min.
// Shortens to 60s if editorial cadence picks up; `revalidate` alone is enough,
// no `dynamic = 'force-static'` because some pages read query params.
export const revalidate = 300;

import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { buildMetadata } from "@/lib/seo";
import { POST_LIST } from "@/lib/blog";

export const metadata: Metadata = buildMetadata({
  title: "Blog — updates from the flyingbluewhale team",
  description:
    "Essays on production operations, platform architecture, and how to run shows with less duct tape. From the GHXSTSHIP team.",
  path: "/blog",
  keywords: ["production blog", "event production software blog", "flyingbluewhale blog"],
  ogImageEyebrow: "Blog",
  ogImageTitle: "Updates from the team.",
});

export default function BlogIndex() {
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      <section className="mx-auto max-w-4xl px-6 pt-8 pb-10">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--org-primary)]">Blog</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">Updates From the Team.</h1>
        <p className="mt-5 max-w-2xl text-lg text-[var(--text-secondary)]">
          Essays on production operations, platform architecture, and how to run shows with less duct tape.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-8">
        <ul className="space-y-4">
          {POST_LIST.map((p) => (
            <li key={p.slug}>
              <Link href={`/blog/${p.slug}`} className="surface-raised hover-lift block p-6">
                <div className="font-mono text-xs text-[var(--text-muted)]">{p.date} · {p.readingTime}</div>
                <div className="mt-2 text-xl font-semibold tracking-tight">{p.title}</div>
                <div className="mt-2 text-sm text-[var(--text-secondary)]">{p.blurb}</div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.keywords.slice(0, 4).map((k) => (
                    <span key={k} className="rounded-full bg-[var(--surface-inset)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                      {k}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
