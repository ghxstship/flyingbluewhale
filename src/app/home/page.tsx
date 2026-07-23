import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { AppSwitcher } from "@/components/workspace-chrome/AppSwitcher";
import { defaultSwitcherEntries } from "@/components/workspace-chrome/WorkspaceChrome";

export const dynamic = "force-dynamic";

const BRAND_DOT: Record<string, string> = {
  platform: "bg-[var(--brand-atlvs)]",
  portal: "bg-[var(--brand-gvteway)]",
  mobile: "bg-[var(--brand-compvss)]",
};

const TAGLINE: Record<string, string> = {
  platform: "Operator console — ERP × CRM × PM.",
  portal: "Public interface & marketplace.",
  mobile: "Site & venue field operations.",
};

/**
 * /home — the post-auth launcher (kit v7 AppSwitcher archetype). After auth
 * resolves, the user lands here to pick which app to enter. Renders the
 * cross-shell entries as launch cards and mounts the <AppSwitcher> popover for
 * the same quick switch. Token-gated entry (reached via redirect, not nav) —
 * EXEMPT from sitemap reconciliation.
 */
export default async function HomeLauncherPage() {
  const session = await requireSession();
  const entries = defaultSwitcherEntries(session.role, session.orgSlug || null);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-10 px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-xs tracking-[0.14em] text-[var(--p-accent-text)] uppercase">ATLVS Technologies</p>
          <h1 className="text-[var(--p-text-1)]">Welcome back</h1>
          <p className="text-[var(--p-text-2)]">{session.email} · choose where to work.</p>
        </div>
        <AppSwitcher current="platform" entries={entries} />
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {entries.map((e) => (
          <Link
            key={e.shell}
            href={e.href}
            className="group rounded-[var(--p-r-lg,12px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-5 transition-colors hover:border-[var(--p-border-2)] hover:bg-[var(--p-surface-2)]"
          >
            <span aria-hidden className={`mb-3 inline-block h-2.5 w-2.5 rounded-full ${BRAND_DOT[e.shell] ?? ""}`} />
            <div className="text-lg font-semibold text-[var(--p-text-1)]">{e.label}</div>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">{TAGLINE[e.shell] ?? ""}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
