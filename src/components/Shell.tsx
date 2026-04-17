import Link from "next/link";
import { Home, QrCode, BookOpen, CheckSquare, User } from "lucide-react";
import type { NavGroup, NavItem } from "@/lib/nav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const MOBILE_TAB_ICONS: Record<string, typeof Home> = {
  "/m": Home,
  "/m/check-in": QrCode,
  "/m/guide": BookOpen,
  "/m/tasks": CheckSquare,
  "/m/settings": User,
};

export function PageStub({ title, description }: { title: string; description?: string }) {
  return (
    <>
      <ModuleHeader title={title} subtitle={description} />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--text-muted)]">
          Placeholder view — wire real module content here. See <code className="font-mono">docs/ia/01-topology.md</code>.
        </div>
      </div>
    </>
  );
}

export function MarketingHeader() {
  const items: NavItem[] = [
    { label: "Features", href: "/features" },
    { label: "Solutions", href: "/solutions/live-events" },
    { label: "Pricing", href: "/pricing" },
    { label: "Customers", href: "/customers" },
    { label: "Blog", href: "/blog" },
    { label: "Docs", href: "/docs" },
  ];
  return (
    <header className="sticky top-0 z-40 glass-nav">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-base font-semibold tracking-tight text-[var(--foreground)]">
          flyingbluewhale
        </Link>
        <nav className="hidden gap-1 md:flex">
          {items.map((i) => <Link key={i.href} href={i.href} className="nav-item">{i.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
          <Link href="/signup" className="btn btn-primary btn-sm">Sign up</Link>
        </div>
      </div>
    </header>
  );
}

export function AuthCard({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto mt-20 w-full max-w-sm animate-slide-up">
      <div className="surface-raised p-7">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export function PlatformSidebar({ groups, currentPath }: { groups: NavGroup[]; currentPath?: string }) {
  return (
    <aside className="w-64 shrink-0 overflow-y-auto border-r border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
      <Link href="/console" className="block px-3 py-3 text-sm font-semibold tracking-tight text-[var(--foreground)]">
        flyingbluewhale
      </Link>
      {groups.map((g) => (
        <div key={g.label} className="mt-4">
          <div className="nav-label">{g.label}</div>
          <ul className="mt-0.5 space-y-0.5">
            {g.items.map((i) => {
              const active = currentPath === i.href;
              return (
                <li key={i.href}>
                  <Link href={i.href} className={active ? "nav-item nav-item-active" : "nav-item"}>
                    {i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}

export function PortalRail({ items, title, currentPath }: { items: NavItem[]; title: string; currentPath?: string }) {
  return (
    <aside className="w-56 shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] p-3">
      <div className="nav-label">{title}</div>
      <ul className="mt-0.5 space-y-0.5">
        {items.map((i) => {
          const active = currentPath === i.href;
          return (
            <li key={i.href}>
              <Link href={i.href} className={active ? "nav-item nav-item-active" : "nav-item"}>
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export function MobileTabBar({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--border-color)] bg-[var(--background)]/95 backdrop-blur">
      {items.map((i) => {
        const Icon = MOBILE_TAB_ICONS[i.href] ?? Home;
        return (
          <Link
            key={i.href}
            href={i.href}
            className="flex flex-col items-center justify-center gap-1 py-2.5 text-[0.62rem] font-medium uppercase tracking-wide text-[var(--text-muted)] hover:text-[var(--org-primary)]"
          >
            <Icon size={18} />
            <span>{i.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ModuleHeader({
  title,
  subtitle,
  action,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="module-header">
      <div className="module-header-inner">
        <div>
          {eyebrow && (
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--org-primary)]">
              {eyebrow}
            </div>
          )}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

export function PageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="page-content space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-14" />
      ))}
    </div>
  );
}
