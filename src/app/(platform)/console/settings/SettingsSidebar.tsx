"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { settingsNav } from "@/lib/nav";
import { matchRoute } from "@/lib/hooks/useActiveRoute";
import { useT } from "@/lib/i18n/LocaleProvider";

export function SettingsSidebar() {
  const pathname = usePathname();
  const t = useT();
  return (
    <aside
      aria-label={t("console.settings.sidebar.ariaLabel", undefined, "Settings")}
      className="w-full shrink-0 border-e border-[var(--p-border)] bg-[var(--p-surface)] md:w-[240px]"
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--p-border)] px-3 py-3">
          <Link
            href="/console"
            className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.28em] text-[var(--p-text-2)] uppercase hover:text-[var(--p-text-1)]"
          >
            <ChevronLeft size={12} aria-hidden="true" />
            {t("console.settings.sidebar.backToWorkspace", undefined, "Back to Workspace")}
          </Link>
          <div className="mt-2 text-sm font-semibold text-[var(--p-text-1)]">
            {t("console.settings.sidebar.title", undefined, "Settings")}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {settingsNav.map((g) => (
            <div key={g.label} className="mb-3">
              <div className="px-2 text-[10px] font-semibold tracking-[0.2em] text-[var(--p-text-2)] uppercase">
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
                            ? "bg-[var(--p-surface)] font-medium text-[var(--p-text-1)]"
                            : "text-[var(--p-text-2)] hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
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
