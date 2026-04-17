const ENTRIES = [
  { date: "2026-04-22", title: "Boarding Pass guides", items: ["Event guide CMS in ATLVS", "Portal + mobile rendering", "Role-scoped views", "Tier 1–5 classification banners"] },
  { date: "2026-04-20", title: "AI assistant", items: ["Streaming chat via Anthropic Claude", "Conversation history per workspace", "Drafting templates"] },
  { date: "2026-04-18", title: "Finance + procurement", items: ["Invoices with Stripe Connect", "Expenses with receipt upload", "Budgets with live utilization"] },
  { date: "2026-04-16", title: "v0.1", items: ["Three shells launched (console + portal + mobile)", "Supabase auth + RLS", "33 tables wired"] },
];

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Changelog</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Recent product updates</h1>
      <ul className="mt-10 space-y-6">
        {ENTRIES.map((e) => (
          <li key={e.date} className="border-l-2 border-[var(--org-primary)] pl-4">
            <div className="font-mono text-xs text-[var(--text-muted)]">{e.date}</div>
            <div className="mt-1 text-lg font-semibold">{e.title}</div>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-[var(--text-secondary)]">
              {e.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
