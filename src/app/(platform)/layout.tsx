import { PlatformSidebar } from "@/components/Shell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { CommandPalette, CommandPaletteTrigger } from "@/components/CommandPalette";
import { platformNav } from "@/lib/nav";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-platform="atlvs" className="console-shell">
      <PlatformSidebar groups={platformNav} />
      <div className="console-main">
        <header className="glass-nav sticky top-0 z-30 flex items-center justify-between px-6 py-2.5">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">Console</div>
          <div className="flex items-center gap-3">
            <CommandPaletteTrigger />
            <ThemeToggle />
          </div>
        </header>
        <div className="console-content animate-page-enter">{children}</div>
      </div>
      <CommandPalette scope="platform" />
    </div>
  );
}
