import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const tabs = [
  { label: "Dashboard", href: "/me" },
  { label: "Profile", href: "/me/profile" },
  { label: "Settings", href: "/me/settings" },
  { label: "Notifications", href: "/me/notifications" },
  { label: "Security", href: "/me/security" },
  { label: "Tickets", href: "/me/tickets" },
  { label: "Organizations", href: "/me/organizations" },
];

export default function PersonalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell">
      <div className="mx-auto max-w-5xl px-6 pt-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight text-[var(--foreground)]">
            flyingbluewhale
          </Link>
          <ThemeToggle />
        </div>
        <nav className="mt-4 flex flex-wrap gap-1 border-b border-[var(--border-color)] pb-2">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} className="nav-item text-sm">{t.label}</Link>
          ))}
        </nav>
      </div>
      <main className="mx-auto max-w-5xl px-6 py-8 animate-page-enter">{children}</main>
    </div>
  );
}
