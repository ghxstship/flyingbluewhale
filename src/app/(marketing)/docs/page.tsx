// Static page — pre-render at build, no streaming Suspense on client nav.
export const dynamic = "force-static";

import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Docs — Architecture, API, Guides CMS, Auth",
    description:
    "Technical reference for the Second Star Technologies platform — architecture, integrations, the Guides CMS, and the auth model. The deep details for teams who want them.",
  path: "/docs",
  keywords: ["Second Star Technologies docs", "ATLVS docs", "GVTEWAY docs", "COMPVSS docs", "API reference", "architecture", "auth model"],
  ogImageEyebrow: "Docs",
  ogImageTitle: "How the platform works",
});

const SECTIONS = [
  { title: "Architecture", desc: "Three connected apps on one backbone. Every org's data walled off.", href: "/features" },
  { title: "API v1", desc: "A clean REST API with validated inputs and predictable responses.", href: "/console/settings/api" },
  { title: "Guides CMS", desc: "Author a Know Before You Go from ATLVS. Render it role-scoped across portal and mobile.", href: "/features" },
  { title: "Auth model", desc: "Ten platform roles and four project roles — enforced at the data layer.", href: "/features" },
];

export default function DocsLanding() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Docs</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">How the Platform Works</h1>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link key={s.title} href={s.href} className="surface hover-lift p-5">
            <div className="text-sm font-semibold">{s.title}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
