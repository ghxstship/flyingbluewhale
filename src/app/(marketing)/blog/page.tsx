import Link from "next/link";

const POSTS = [
  { slug: "launch", title: "Launching flyingbluewhale", date: "2026-04-16", blurb: "Three shells, one database, zero spreadsheets." },
  { slug: "boarding-pass", title: "KBYG guides, now native", date: "2026-04-18", blurb: "We integrated the Boarding Pass pattern into portals + mobile." },
  { slug: "ai-assistant", title: "AI assistant shipped", date: "2026-04-22", blurb: "Streaming Claude responses grounded in your workspace." },
];

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Blog</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Updates from the team</h1>
      <ul className="mt-10 space-y-4">
        {POSTS.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="surface hover-lift block p-5">
              <div className="font-mono text-xs text-[var(--text-muted)]">{p.date}</div>
              <div className="mt-1 text-lg font-semibold">{p.title}</div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">{p.blurb}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
