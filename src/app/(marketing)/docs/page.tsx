import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Docs — Architecture, API, Guides CMS, Auth",
  description:
    "Technical reference for flyingbluewhale: the three-shell architecture, the envelope-contract REST API, the Guides CMS, and the Supabase-backed auth model.",
  path: "/docs",
  keywords: ["flyingbluewhale docs", "API reference", "architecture", "auth model"],
  ogImageEyebrow: "Docs",
  ogImageTitle: "How flyingbluewhale works",
});

const SECTIONS = [
  { title: "Architecture", desc: "Three shells, one database. RLS-scoped per org.", href: "/features" },
  { title: "API v1", desc: "Zod-validated REST API with ok/error envelopes.", href: "/console/settings/api" },
  { title: "Guides CMS", desc: "Author a per-role Know-Before-You-Go from ATLVS, served in portals + mobile.", href: "/features" },
  { title: "Auth model", desc: "Supabase SSR + 10 platform roles + 4 project roles.", href: "/features" },
];

export default function DocsLanding() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Docs</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">How Flyingbluewhale Works</h1>
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
