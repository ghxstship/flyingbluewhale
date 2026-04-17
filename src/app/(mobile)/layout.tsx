import { MobileTabBar } from "@/components/Shell";
import { mobileTabs } from "@/lib/nav";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-platform="compvss" className="page-shell pb-16">
      <main className="animate-fade-in">{children}</main>
      <MobileTabBar items={mobileTabs} />
    </div>
  );
}
