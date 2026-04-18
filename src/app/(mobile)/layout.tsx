import { MobileTabBar } from "@/components/Shell";
import { CommandPalette } from "@/components/CommandPalette";
import { OfflineBanner } from "@/components/mobile/OfflineBanner";
import { mobileTabs } from "@/lib/nav";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-platform="compvss" className="page-shell mobile-shell">
      <OfflineBanner />
      <main className="animate-fade-in">{children}</main>
      <MobileTabBar items={mobileTabs} />
      <CommandPalette scope="mobile" />
    </div>
  );
}
