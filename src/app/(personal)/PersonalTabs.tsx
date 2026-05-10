"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Dashboard", href: "/me" },
  { label: "Profile", href: "/me/profile" },
  { label: "Appearance", href: "/me/settings/appearance" },
  { label: "Settings", href: "/me/settings" },
  { label: "Notifications", href: "/me/notifications" },
  { label: "Security", href: "/me/security" },
  { label: "Privacy", href: "/me/privacy" },
  { label: "Tickets", href: "/me/tickets" },
  { label: "Organizations", href: "/me/organizations" },
];

export function PersonalTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Personal account" className="mt-4 flex flex-wrap gap-1 border-b border-[var(--border-color)] pb-2">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className="nav-item text-sm"
          aria-current={pathname === t.href ? "page" : undefined}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
