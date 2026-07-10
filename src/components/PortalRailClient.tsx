"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet";
import { matchRoute } from "@/lib/match-route";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Client half of the portal rail. The server `PortalRail` translates the
 * nav labels and passes serializable sections down; these components own
 * the pieces that need the browser:
 *
 * - `PortalRailNav` — the section list with live active-route state
 *   (`usePathname` + `matchRoute`), so `aria-current` works on every
 *   portal page without each caller threading its pathname through.
 * - `PortalMobileNav` — the below-`md` nav affordance. The desktop rail
 *   is `hidden md:flex`, which used to orphan every portal leaf page on
 *   phones; this renders a fixed menu button that opens the same nav
 *   sections in a `Sheet` drawer.
 */

export type PortalRailSection = {
  label: string;
  items: { label: string; href: string }[];
};

export function PortalRailNav({
  sections,
  onNavigate,
}: {
  sections: PortalRailSection[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <>
      {sections.map((section, idx) => (
        <div key={`${section.label}-${idx}`} className={idx === 0 ? "mt-0.5" : "mt-3"}>
          {idx > 0 && section.label ? (
            <div className="nav-label px-2 pb-1 text-[11px] tracking-wider text-[var(--p-text-2)] uppercase">
              {section.label}
            </div>
          ) : null}
          <ul className="space-y-0.5">
            {section.items.map((i) => {
              const { isActive: active } = matchRoute(pathname ?? "", i.href);
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={active ? "nav-item nav-item-active" : "nav-item"}
                  >
                    {i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

export function PortalMobileNav({ sections, title }: { sections: PortalRailSection[]; title?: string }) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  // Auto-close on route change so each tap-to-navigate dismisses the drawer.
  const lastPathRef = React.useRef(pathname);
  React.useEffect(() => {
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      setOpen(false);
    }
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("p.shared.nav.open", undefined, "Open navigation")}
          className="fixed bottom-4 start-4 z-[var(--p-z-nav)] inline-flex h-11 items-center gap-2 rounded-full border border-[var(--p-border)] bg-[var(--p-surface)] px-4 text-sm font-semibold text-[var(--p-text-1)] shadow-[var(--p-elev-lg,0_4px_16px_rgba(0,0,0,0.18))] md:hidden"
        >
          <Menu size={16} aria-hidden="true" />
          {t("p.shared.nav.menu", undefined, "Menu")}
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        // The Sheet portals onto <body>, outside the portal shell's
        // data-theme cascade — re-anchor the skin so it paints the
        // GVTEWAY surfaces + accent.
        data-theme="atlvs-product"
        data-platform="gvteway"
        className="w-[85vw] max-w-[320px] overflow-y-auto bg-[var(--p-surface)] p-0 text-[var(--p-text-1)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--p-border)] px-4 py-3">
          <div className="min-w-0 truncate text-sm font-semibold">
            {title || t("p.shared.nav.title", undefined, "Portal")}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t("p.shared.nav.close", undefined, "Close navigation")}
            className="rounded p-1 text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <nav className="px-3 py-3" aria-label={t("p.shared.nav.ariaLabel", undefined, "Portal navigation")}>
          <PortalRailNav sections={sections} onNavigate={() => setOpen(false)} />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
