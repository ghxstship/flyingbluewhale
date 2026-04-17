import { MarketingHeader } from "@/components/Shell";
import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <MarketingHeader />
      <main>{children}</main>
      <footer className="mt-24 border-t border-[var(--border-color)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-[var(--text-muted)]">
          <span>© flyingbluewhale</span>
          <nav className="flex gap-4">
            <Link href="/legal/terms">Terms</Link>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/dpa">DPA</Link>
            <Link href="/legal/sla">SLA</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
