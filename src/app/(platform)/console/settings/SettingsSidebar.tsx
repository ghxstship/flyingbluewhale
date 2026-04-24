"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { settingsNav } from "@/lib/nav";
import { matchRoute } from "@/lib/hooks/useActiveRoute";

export function SettingsSidebar() {
  const pathname = usePathname();
  return (
    <aside
      aria-label="Settings"
      className="w-full shrink-0 border-e border-[var(--border-color)] bg-[var(--bg-secondary)] lg:w-[240px]"
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--border-color)] px-3 py-3">
          <Link
            href="/console"
            className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ChevronLeft size={12} aria-hidden="true" />
            Back to Console
          </Link>
          <div className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Settings</div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {settingsNav.map((g) => (
            <div key={g.label} className="mb-3">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {g.label}
              </div>
              <ul className="mt-0.5 space-y-0.5">
                {g.items.map((item) => {
                  const { isActive: active } = matchRoute(pathname ?? "", item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center rounded px-2 py-1.5 text-xs transition-colors ${
                          active
                            ? "bg-[var(--surface)] font-medium text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
