import { MobileTabBar } from "@/components/Shell";
import { CommandPalette } from "@/components/CommandPalette";
import { ConnectivityBanner } from "@/components/ui/GlobalBanner";
import { TenantShell } from "@/components/TenantShell";
import { mobileTabs } from "@/lib/nav";
import { requireSession } from "@/lib/auth";

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  // Protect the entire compvss shell — no session → redirect to /login.
  // Individual sub-pages may call requireSession() too; this is the outer guard.
  await requireSession("/login");
  return (
    <TenantShell>
      <div data-platform="compvss" className="page-shell mobile-shell">
        <ConnectivityBanner />
        <main className="animate-fade-in">{children}</main>
        <MobileTabBar items={mobileTabs} />
        <CommandPalette scope="mobile" />
      </div>
    </TenantShell>
  );
}
