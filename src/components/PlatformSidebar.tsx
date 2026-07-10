"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Search, PanelLeftClose, PanelLeftOpen, Pin, PinOff, ChevronRight, ChevronDown } from "lucide-react";
import {
  NAV_LENSES,
  NAV_LENS_ORDER,
  platformUtility,
  type NavCountKey,
  type NavGroup,
  type NavItem,
  type NavLens,
  type NavSection,
} from "@/lib/nav";
import { NAV_ICONS } from "@/components/nav-icons";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import { useHotkeys, registerShortcut } from "@/lib/hooks/useHotkeys";
import { matchRoute } from "@/lib/hooks/useActiveRoute";
import { Hint } from "@/components/ui/Tooltip";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { LocaleSwitcher } from "@/components/marketing/LocaleSwitcher";
import { BRAND } from "@/lib/brand";
import { useT } from "@/lib/i18n/LocaleProvider";
import { navGroupKey, navItemKey } from "@/lib/i18n/nav-label";

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const COLLAPSED_WIDTH = 56;

export function PlatformSidebar({
  groups,
  workspaceName,
  counts,
}: {
  groups: NavGroup[];
  /** Pre-resolved active workspace name so the server-rendered sidebar
   *  doesn't flash "Workspace" before the switcher hydrates. */
  workspaceName?: string;
  /** Live count badges (kit 21 W1) — resolved server-side per request in the
   *  (platform) layout, keyed by NavItem.countKey. */
  counts?: Partial<Record<NavCountKey, number>>;
}) {
  const t = useT();
  const pathname = usePathname();
  const { prefs, setPrefs } = useUserPreferences();

  const [collapsed, setCollapsed] = React.useState<boolean>(prefs.sidebar_collapsed ?? false);
  const [width, setWidth] = React.useState<number>(prefs.sidebar_width ?? 240);
  const [pinned, setPinned] = React.useState<string[]>(prefs.sidebar_pinned ?? []);
  // Allow-list of expanded groups. Default: empty → every group collapsed.
  // The active-route group still force-opens below so the user can never
  // lose their current page from the nav.
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(prefs.sidebar_expanded_groups ?? []);
  // Role Lens (v7.8 zero-training layer) — persona preset over the rail
  // groups. A default, not a cage: "All" reveals everything, pinned items
  // escape the lens, and the active-route group is always kept.
  const [lens, setLens] = React.useState<NavLens>(
    prefs.nav_lens && prefs.nav_lens in NAV_LENSES ? (prefs.nav_lens as NavLens) : "All",
  );
  const [query, setQuery] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Sync from prefs once loaded
  React.useEffect(() => {
    if (prefs.sidebar_collapsed != null) setCollapsed(prefs.sidebar_collapsed);
    if (prefs.sidebar_width != null) setWidth(prefs.sidebar_width);
    if (prefs.sidebar_pinned != null) setPinned(prefs.sidebar_pinned);
    if (prefs.sidebar_expanded_groups != null) setExpandedGroups(prefs.sidebar_expanded_groups);
    if (prefs.nav_lens && prefs.nav_lens in NAV_LENSES) setLens(prefs.nav_lens as NavLens);
  }, [prefs.sidebar_collapsed, prefs.sidebar_width, prefs.sidebar_pinned, prefs.sidebar_expanded_groups, prefs.nav_lens]);

  // Register shortcuts for the cheatsheet
  React.useEffect(() => {
    const unregister = [
      registerShortcut(
        "mod+b",
        t("shell.sidebar.shortcutToggle", undefined, "Collapse / expand sidebar"),
        "Navigation",
      ),
      registerShortcut("/", t("shell.sidebar.shortcutSearch", undefined, "Focus sidebar search"), "Navigation"),
    ];
    return () => unregister.forEach((fn) => fn());
  }, [t]);

  // Shortcuts
  useHotkeys([
    {
      combo: "mod+b",
      handler: () => {
        const next = !collapsed;
        setCollapsed(next);
        void setPrefs({ sidebar_collapsed: next });
      },
    },
    {
      combo: "/",
      skipWhenEditing: true,
      handler: () => {
        if (collapsed) {
          setCollapsed(false);
          void setPrefs({ sidebar_collapsed: false });
        }
        setShowSearch(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      },
    },
  ]);

  // Drag resize
  const resizeRef = React.useRef({ active: false, startX: 0, startWidth: 0 });
  function onResizeStart(e: React.PointerEvent) {
    if (collapsed) return;
    resizeRef.current = { active: true, startX: e.clientX, startWidth: width };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onResizeMove(e: React.PointerEvent) {
    if (!resizeRef.current.active) return;
    const dx = e.clientX - resizeRef.current.startX;
    const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeRef.current.startWidth + dx));
    setWidth(next);
  }
  function onResizeEnd(e: React.PointerEvent) {
    if (!resizeRef.current.active) return;
    resizeRef.current.active = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    void setPrefs({ sidebar_width: width });
  }

  function togglePin(href: string) {
    setPinned((prev) => {
      const next = prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href];
      void setPrefs({ sidebar_pinned: next });
      return next;
    });
  }

  function toggleGroup(label: string) {
    setExpandedGroups((prev) => {
      const next = prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label];
      void setPrefs({ sidebar_expanded_groups: next });
      return next;
    });
  }

  // Flatten a group's items — counts items from `sections` if present so
  // search/pin/active-route checks all consume one canonical list.
  const itemsOf = React.useCallback((g: NavGroup): NavItem[] => {
    if (g.sections && g.sections.length > 0) return g.sections.flatMap((s) => s.items);
    return g.items;
  }, []);

  // Role-lens pass — runs BEFORE search so "/" search operates within the
  // chosen lens. The group containing the active route is always kept
  // (hiding the current page would be hostile), matching the force-open rule.
  const lensed = React.useMemo<NavGroup[]>(() => {
    const allow = NAV_LENSES[lens];
    if (!allow) return groups;
    return groups.filter((g) => {
      if (allow.includes(g.label)) return true;
      const items = g.sections && g.sections.length > 0 ? g.sections.flatMap((s) => s.items) : g.items;
      return (
        items.some((i) => matchRoute(pathname ?? "", i.href).isActive) ||
        (!!g.href && matchRoute(pathname ?? "", g.href).isActive)
      );
    });
  }, [groups, lens, pathname]);

  // Filter groups by query — when sections are present, filter them
  // section-by-section so empty sections drop out. Search also spans the
  // platformUtility surfaces the rail doesn't carry (A-31), synthesized as
  // a trailing "Utility" group, so "/" finds the same set ⌘K does.
  const filtered = React.useMemo<NavGroup[]>(() => {
    if (!query) return lensed;
    const q = query.toLowerCase();
    const railHrefs = new Set(groups.flatMap((g) => itemsOf(g)).map((i) => i.href));
    const out = lensed
      .map((g) => {
        if (g.sections && g.sections.length > 0) {
          const sections = g.sections
            .map((s) => ({ ...s, items: s.items.filter((i) => i.label.toLowerCase().includes(q)) }))
            .filter((s) => s.items.length > 0);
          return { ...g, sections, items: sections.flatMap((s) => s.items) };
        }
        return { ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) };
      })
      .filter((g) => itemsOf(g).length > 0);
    const utilityMatches = platformUtility.filter(
      (i) => i.label.toLowerCase().includes(q) && !railHrefs.has(i.href),
    );
    if (utilityMatches.length > 0) out.push({ label: "Utility", items: utilityMatches });
    return out;
  }, [lensed, groups, query, itemsOf]);

  // Pinned items as a synthesized group
  const pinnedItems: NavItem[] = React.useMemo(() => {
    if (!pinned.length) return [];
    const all = groups.flatMap((g) => itemsOf(g));
    return pinned.map((href) => all.find((i) => i.href === href)).filter(Boolean) as NavItem[];
  }, [pinned, groups, itemsOf]);

  const currentWidth = collapsed ? COLLAPSED_WIDTH : width;

  return (
    <aside
      aria-label={t("shell.sidebar.primary", undefined, "Primary")}
      data-tour="nav"
      // hidden md:flex: the desktop sidebar is suppressed below 768px
      // because its width swallows the entire phone viewport. The
      // MobileNavDrawer (top bar hamburger) replaces it for `< md`. See
      // (platform)/layout.tsx for the drawer mount.
      className="relative hidden shrink-0 overflow-hidden border-e border-[var(--p-border)] bg-[var(--p-surface)] transition-[width] duration-[var(--motion-fast)] ease-[var(--ease-hover)] md:block"
      style={{ width: `${currentWidth}px` }}
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* Header: workspace switcher + (expanded only) collapse toggle.
            Audit DS-L2: explicit min-h-14 (56px) so this row reads at the
            same vertical height as the glass-nav top bar — the two form a
            single horizontal band across the shell. In rail mode the
            workspace tile is the orientation anchor and gets the full
            56px-wide header to itself; the collapse toggle relocates to
            the rail footer (Linear / Notion convention). */}
        <div className="flex min-h-14 items-center gap-1 border-b border-[var(--p-border)] px-2 py-2">
          <div className={collapsed ? "flex w-full justify-center" : "min-w-0 flex-1"}>
            <WorkspaceSwitcher collapsed={collapsed} initialName={workspaceName} />
          </div>
          {!collapsed && (
            <Hint label={t("shell.sidebar.collapseHint", undefined, "Collapse sidebar · ⌘B")} side="right">
              <button
                type="button"
                onClick={() => {
                  setCollapsed(true);
                  void setPrefs({ sidebar_collapsed: true });
                }}
                className="shrink-0 rounded p-1 text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)]"
                aria-label={t("shell.sidebar.collapse", undefined, "Collapse sidebar")}
              >
                <PanelLeftClose size={14} />
              </button>
            </Hint>
          )}
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="border-b border-[var(--p-border)] px-3 py-2">
            {showSearch ? (
              <div className="flex items-center gap-2 rounded-md bg-[var(--p-surface)] px-2 py-1">
                <Search size={12} className="text-[var(--p-text-2)]" aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => !query && setShowSearch(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setQuery("");
                      setShowSearch(false);
                    }
                  }}
                  placeholder={t("shell.sidebar.searchNavPlaceholder", undefined, "Search nav…")}
                  aria-label={t("shell.sidebar.searchNavAria", undefined, "Search navigation")}
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowSearch(true);
                  setTimeout(() => searchRef.current?.focus(), 50);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-xs text-[var(--p-text-2)] hover:bg-[var(--p-surface)]"
                aria-label={t("shell.sidebar.openSearch", undefined, "Open sidebar search")}
              >
                <span className="flex items-center gap-2">
                  <Search size={12} aria-hidden="true" />
                  <span>{t("shell.sidebar.search", undefined, "Search")}</span>
                </span>
                <kbd className="font-mono text-[11px]">/</kbd>
              </button>
            )}
          </div>
        )}

        {/* Role Lens — persona preset over the rail groups (v7.8). A quiet
            select, styled like the search row; hidden in rail mode. */}
        {!collapsed && (
          <div className="flex items-center gap-2 border-b border-[var(--p-border)] px-3 py-1.5">
            <label
              htmlFor="sidebar-role-lens"
              className="font-mono text-[11px] tracking-[0.14em] text-[var(--p-text-3)] uppercase"
            >
              {t("shell.sidebar.lens", undefined, "Lens")}
            </label>
            <select
              id="sidebar-role-lens"
              value={lens}
              onChange={(e) => {
                const next = e.target.value as NavLens;
                setLens(next);
                void setPrefs({ nav_lens: next });
              }}
              className="w-full cursor-pointer rounded-md bg-transparent py-0.5 text-xs text-[var(--p-text-2)] outline-none hover:text-[var(--p-text-1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)]"
            >
              {NAV_LENS_ORDER.map((l) => (
                <option key={l} value={l}>
                  {t(`shell.sidebar.lens${l}`, undefined, l)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          {pinnedItems.length > 0 && !query && (
            <SidebarGroup
              label={t("shell.sidebar.pinned", undefined, "Pinned")}
              items={pinnedItems}
              pathname={pathname}
              collapsed={collapsed}
              pinned={pinned}
              onTogglePin={togglePin}
              counts={counts}
              // Pinned is always expanded — the whole point is one-click access.
              isOpen
              onToggleGroup={null}
            />
          )}
          {filtered.map((g) => {
            // A group is "open" when: sidebar-narrow-mode is off AND
            // (search query is active OR the active route lives in this group
            //  OR the user has explicitly expanded it). Default is collapsed
            //  so the sidebar reads as a clean list of group headers; the
            //  active-route group force-opens so the user can never lose
            //  their current page from the nav.
            const groupItems = itemsOf(g);
            const hasActive =
              groupItems.some((i) => matchRoute(pathname ?? "", i.href).isActive) ||
              (!!g.href && matchRoute(pathname ?? "", g.href).isActive);
            const userExpanded = expandedGroups.includes(g.label);
            const isOpen = collapsed ? false : Boolean(query) || hasActive || userExpanded;
            return (
              <SidebarGroup
                key={g.label}
                label={g.label}
                href={g.href}
                items={g.items}
                sections={g.sections}
                pathname={pathname}
                collapsed={collapsed}
                pinned={pinned}
                onTogglePin={togglePin}
                counts={counts}
                isOpen={isOpen}
                // Disable the toggle when the group is forced open (active route
                // lives inside) — hiding the current page would be hostile.
                onToggleGroup={query || hasActive ? null : toggleGroup}
              />
            );
          })}
          {query && filtered.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-[var(--p-text-2)]">No results</div>
          )}
        </nav>

        {/* Sidebar footer — in expanded mode surfaces the shell brand so
            every authenticated page in the console reminds the operator
            which app they're in (parent/trademark attribution lives on
            marketing + /legal only). In rail mode hosts the expand
            toggle, since the rail header is reserved for the workspace
            tile per Linear/Notion convention. */}
        {collapsed ? (
          <Hint label={t("shell.sidebar.expandHint", undefined, "Expand sidebar · ⌘B")} side="right">
            <button
              type="button"
              onClick={() => {
                setCollapsed(false);
                void setPrefs({ sidebar_collapsed: false });
              }}
              className="flex w-full items-center justify-center border-t border-[var(--p-border)] py-3 text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)]"
              aria-label={t("shell.sidebar.expand", undefined, "Expand sidebar")}
            >
              <PanelLeftOpen size={14} />
            </button>
          </Hint>
        ) : (
          <div className="flex items-center justify-between gap-2 border-t border-[var(--p-border)] px-3 py-2.5">
            {/* Canonical SaaS brand mark — accent tile + white skull +
                name + product subtitle, mirrors ui_kits/atlvs/
                dashboard.html .brandrow. Tile uses --p-accent (the
                per-product overlay sets this), skull is white-inverted
                via CSS filter, name is Hanken Grotesk 700 with -0.01em
                tracking, subtitle is Space Mono uppercase 8px in
                tertiary text. */}
            <div className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="grid h-7 w-7 flex-none place-items-center rounded-[7px]"
                style={{ background: "var(--p-accent, var(--p-accent))" }}
              >
                {/* Kit v3 swap: the ATLVS product mark is the 8-point
                    Waypoint star (atlvs-mark-white.svg), not the GHXSTSHIP
                    ghost-ship skull. The skull is the parent-company mark
                    only and must not appear as the product icon. Per
                    design_handoff/ATLVS_PRODUCT/README.md (v3). */}
                <Image src="/brand/atlvs-mark-white.svg" alt="" width={18} height={18} />
              </span>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-bold tracking-[-0.01em] text-[var(--p-text-1,var(--p-text-1))]">
                  {BRAND.products.console.name}
                </div>
                <div className="truncate font-mono text-[11px] tracking-[0.1em] text-[var(--p-text-3,var(--p-text-2))] uppercase">
                  {BRAND.products.console.subtitle}
                </div>
              </div>
            </div>
            {/* Language switcher mirrors the marketing header so authed
                operators can flip the entire console — internal labels,
                date formats, currency — without leaving the page. Persists
                to user_preferences via setLocalePreferences. */}
            <LocaleSwitcher />
          </div>
        )}
      </div>

      {/* Resize handle — pointer drag OR keyboard: focusable separator with
          arrow-key width steps (WCAG 2.1.1, A-18). */}
      {!collapsed && (
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={t("shell.sidebar.resize", undefined, "Resize sidebar")}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          aria-valuenow={width}
          className="absolute inset-y-0 end-0 w-1 cursor-col-resize hover:bg-[var(--p-accent)]/30 focus-visible:bg-[var(--p-accent)] focus-visible:outline-none active:bg-[var(--p-accent)]"
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
          onKeyDown={(e) => {
            const step = 16;
            let next: number | null = null;
            if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(MAX_WIDTH, width + step);
            else if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(MIN_WIDTH, width - step);
            else if (e.key === "Home") next = MIN_WIDTH;
            else if (e.key === "End") next = MAX_WIDTH;
            if (next == null || next === width) return;
            e.preventDefault();
            setWidth(next);
            void setPrefs({ sidebar_width: next });
          }}
        />
      )}
    </aside>
  );
}

function SidebarGroup({
  label,
  href,
  items,
  sections,
  pathname,
  collapsed,
  pinned,
  onTogglePin,
  counts,
  isOpen,
  onToggleGroup,
}: {
  label: string;
  /** When set, the group header label is a hub link (ADR-0011 navigable
   *  group). A separate chevron handles collapse; the label routes here. */
  href?: string;
  items: NavItem[];
  /** Optional sub-grouping (Linear/Notion pattern). When present, `items` is
   *  ignored and the group renders each section's label + items in order. */
  sections?: NavSection[];
  pathname?: string | null;
  collapsed: boolean;
  pinned: string[];
  onTogglePin: (href: string) => void;
  /** Live count badges keyed by NavItem.countKey (kit 21 W1). */
  counts?: Partial<Record<NavCountKey, number>>;
  /** Whether the group body is visible. Always true when the whole sidebar is
   *  narrow (collapsed mode), when search is active, or when an item in the
   *  group is the active route. */
  isOpen: boolean;
  /** Toggle callback. `null` disables the collapse control — used for the
   *  Pinned pseudo-group and when the group is force-open. */
  onToggleGroup: ((label: string) => void) | null;
}) {
  const t = useT();
  const groupLabelDisplay = t(navGroupKey({ label }), undefined, label);
  const headerId = `sidebar-group-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const useSections = sections && sections.length > 0;
  const headerActive = !!href && matchRoute(pathname ?? "", href).isActive;
  const headerClass =
    "group flex w-full items-center justify-between gap-1 rounded px-2 py-1 text-[11px] font-semibold tracking-wide text-[var(--p-text-2)] transition-colors hover:bg-[var(--p-surface)] hover:text-[var(--p-text-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)]";
  const chevron = (
    <ChevronDown
      size={10}
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-[var(--motion-fast)] ease-[var(--ease-hover)] ${isOpen ? "" : "-rotate-90"}`}
    />
  );
  return (
    <div className="mb-3">
      {!collapsed &&
        // ADR-0011 navigable group: when the group carries a hub `href`, the
        // label is a Link (routes to the module hub) and the chevron is a
        // separate collapse control. This is what lets echo leaves drop
        // without orphaning the hub. Groups without `href` keep the prior
        // toggle-button (or static label when force-open) behaviour.
        (href ? (
          <div className={headerClass}>
            <Link
              href={href}
              prefetch={false}
              id={headerId}
              aria-current={headerActive ? "page" : undefined}
              className={`min-w-0 flex-1 truncate text-start ${headerActive ? "text-[var(--p-text-1)]" : ""}`}
            >
              {groupLabelDisplay}
            </Link>
            {onToggleGroup ? (
              <button
                type="button"
                onClick={() => onToggleGroup(label)}
                aria-expanded={isOpen}
                aria-controls={`${headerId}-items`}
                aria-label={t("shell.sidebar.toggleGroup", { name: groupLabelDisplay }, "Toggle {name}")}
                className="shrink-0 rounded p-0.5 hover:text-[var(--p-text-1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)]"
              >
                {chevron}
              </button>
            ) : (
              chevron
            )}
          </div>
        ) : onToggleGroup ? (
          <button
            type="button"
            id={headerId}
            onClick={() => onToggleGroup(label)}
            aria-expanded={isOpen}
            aria-controls={`${headerId}-items`}
            className={headerClass}
          >
            <span className="truncate">{groupLabelDisplay}</span>
            {chevron}
          </button>
        ) : (
          <div id={headerId} className="px-2 text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">
            {groupLabelDisplay}
          </div>
        ))}
      {(collapsed || isOpen) &&
        (useSections ? (
          <div id={`${headerId}-items`} aria-labelledby={headerId} className="mt-0.5 space-y-2">
            {sections.map((s) => (
              <div key={s.label}>
                {!collapsed && (
                  <div className="mt-1.5 mb-0.5 px-2 text-[11px] font-medium tracking-[0.14em] text-[var(--p-text-2)]/70 uppercase">
                    {t(navGroupKey(s), undefined, s.label)}
                  </div>
                )}
                <SidebarItems
                  items={s.items}
                  pathname={pathname}
                  collapsed={collapsed}
                  pinned={pinned}
                  onTogglePin={onTogglePin}
                  counts={counts}
                />
              </div>
            ))}
          </div>
        ) : (
          <SidebarItems
            id={`${headerId}-items`}
            ariaLabelledBy={headerId}
            items={items}
            pathname={pathname}
            collapsed={collapsed}
            pinned={pinned}
            onTogglePin={onTogglePin}
            counts={counts}
          />
        ))}
    </div>
  );
}

function SidebarItems({
  items,
  pathname,
  collapsed,
  pinned,
  onTogglePin,
  counts,
  id,
  ariaLabelledBy,
}: {
  items: NavItem[];
  pathname?: string | null;
  collapsed: boolean;
  pinned: string[];
  onTogglePin: (href: string) => void;
  counts?: Partial<Record<NavCountKey, number>>;
  id?: string;
  ariaLabelledBy?: string;
}) {
  const t = useT();
  return (
    <ul id={id} aria-labelledby={ariaLabelledBy} className="space-y-0.5">
      {items.map((item) => {
        const { isActive: active } = matchRoute(pathname ?? "", item.href);
        const isPinned = pinned.includes(item.href);
        const Icon = item.icon ? NAV_ICONS[item.icon] : null;
        const itemLabel = t(navItemKey(item), undefined, item.label);
        // Live count badge (kit 21 W1) — only render when > 0, so a rail
        // with nothing waiting stays quiet. Caps at 99+ so long numbers
        // never blow out the pill.
        const count = item.countKey ? (counts?.[item.countKey] ?? 0) : 0;
        const badgeText = count > 99 ? "99+" : String(count);
        const linkEl = (
          <Link
            href={item.href}
            // Prefetch off — see SidebarGroup notes on RSC fetch storms.
            prefetch={false}
            aria-current={active ? "page" : undefined}
            // v7.8 nav-hover subtitle — teaches the noun without a click.
            title={item.sub ? `${itemLabel} · ${item.sub}` : undefined}
            className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)] ${
              collapsed ? "" : "pe-8"
            } ${
              active
                ? "bg-[var(--p-surface)] font-medium text-[var(--p-text-1)]"
                : "text-[var(--p-text-2)] hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
            }`}
          >
            {active && (
              <span aria-hidden="true" className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-[var(--p-accent)]" />
            )}
            <span className="flex min-w-0 flex-1 items-center gap-2 truncate ps-1">
              {Icon ? (
                <span className="relative shrink-0">
                  <Icon
                    size={14}
                    strokeWidth={2}
                    className={
                      active ? "text-[var(--p-text-1)]" : "text-[var(--p-text-2)] group-hover:text-[var(--p-text-1)]"
                    }
                    aria-hidden="true"
                  />
                  {/* Collapsed mode has no room for the numeric pill — show a
                      dot on the icon so the "something's waiting" signal
                      survives. */}
                  {collapsed && count > 0 && (
                    <span
                      aria-hidden="true"
                      className="absolute -end-1 -top-1 h-2 w-2 rounded-full bg-[var(--p-accent)] ring-2 ring-[var(--p-bg)]"
                    />
                  )}
                </span>
              ) : collapsed ? (
                <ChevronRight size={12} className="shrink-0" aria-hidden="true" />
              ) : null}
              {!collapsed && <span className="truncate">{itemLabel}</span>}
              {/* Count pill stays visible on hover (A-30) — the link's pe-8
                  reserves the pin-toggle slot, so no overlap to hide from. */}
              {!collapsed && count > 0 && (
                <span
                  className="ms-auto shrink-0 rounded-full bg-[var(--p-accent)] px-1.5 py-0.5 text-[11px] leading-none font-semibold text-[var(--p-accent-contrast,white)] tabular-nums"
                  aria-label={`${badgeText} ${itemLabel}`}
                >
                  {badgeText}
                </span>
              )}
            </span>
          </Link>
        );
        return (
          <li key={item.href} className="group relative">
            {collapsed ? (
              <Hint label={item.sub ? `${itemLabel} · ${item.sub}` : itemLabel} side="right" delayDuration={300}>
                {linkEl}
              </Hint>
            ) : (
              linkEl
            )}
            {/* Pin toggle sits as an absolutely-positioned sibling of the
                Link — a button nested inside an anchor is invalid HTML.
                The Link reserves its slot via pe-7; hover reveal still
                rides the li's `group` class. */}
            {!collapsed && (
              <button
                type="button"
                onClick={() => onTogglePin(item.href)}
                aria-label={
                  isPinned
                    ? t("nav.unpin", { name: itemLabel }, `Unpin ${itemLabel}`)
                    : t("nav.pin", { name: itemLabel }, `Pin ${itemLabel}`)
                }
                // h-6/w-6 = 24px hit area — WCAG 2.2 §2.5.8 minimum (A-19).
                className={`absolute end-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-[var(--p-text-2)] hover:text-[var(--p-text-1)] focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)] ${
                  isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {isPinned ? <Pin size={10} /> : <PinOff size={10} />}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
