"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  ChevronRight,
} from "lucide-react";
import type { NavGroup, NavItem } from "@/lib/nav";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import { useHotkeys, registerShortcut } from "@/lib/hooks/useHotkeys";
import { matchRoute } from "@/lib/hooks/useActiveRoute";
import { Hint } from "@/components/ui/Tooltip";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const COLLAPSED_WIDTH = 56;

export function PlatformSidebar({
  groups,
  workspaceName,
}: {
  groups: NavGroup[];
  /** Pre-resolved active workspace name so the server-rendered sidebar
   *  doesn't flash "Workspace" before the switcher hydrates. */
  workspaceName?: string;
}) {
  const pathname = usePathname();
  const { prefs, setPrefs } = useUserPreferences();

  const [collapsed, setCollapsed] = React.useState<boolean>(prefs.sidebar_collapsed ?? false);
  const [width, setWidth] = React.useState<number>(prefs.sidebar_width ?? 240);
  const [pinned, setPinned] = React.useState<string[]>(prefs.sidebar_pinned ?? []);
  const [query, setQuery] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Sync from prefs once loaded
  React.useEffect(() => {
    if (prefs.sidebar_collapsed != null) setCollapsed(prefs.sidebar_collapsed);
    if (prefs.sidebar_width != null) setWidth(prefs.sidebar_width);
    if (prefs.sidebar_pinned != null) setPinned(prefs.sidebar_pinned);
  }, [prefs.sidebar_collapsed, prefs.sidebar_width, prefs.sidebar_pinned]);

  // Register shortcuts for the cheatsheet
  React.useEffect(() => {
    const unregister = [
      registerShortcut("mod+b", "Collapse / expand sidebar", "Navigation"),
      registerShortcut("/", "Focus sidebar search", "Navigation"),
    ];
    return () => unregister.forEach((fn) => fn());
  }, []);

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

  // Filter groups by query
  const filtered = React.useMemo(() => {
    if (!query) return groups;
    const q = query.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  // Pinned items as a synthesized group
  const pinnedItems: NavItem[] = React.useMemo(() => {
    if (!pinned.length) return [];
    const all = groups.flatMap((g) => g.items);
    return pinned.map((href) => all.find((i) => i.href === href)).filter(Boolean) as NavItem[];
  }, [pinned, groups]);

  const currentWidth = collapsed ? COLLAPSED_WIDTH : width;

  return (
    <aside
      aria-label="Primary"
      className="relative shrink-0 overflow-hidden border-e border-[var(--border-color)] bg-[var(--bg-secondary)] transition-[width] duration-150"
      style={{ width: `${currentWidth}px` }}
    >
      <div className="flex h-full flex-col">
        {/* Header: workspace switcher + collapse toggle */}
        <div className="flex items-center gap-1 border-b border-[var(--border-color)] px-2 py-2">
          <div className="min-w-0 flex-1">
            <WorkspaceSwitcher collapsed={collapsed} initialName={workspaceName} />
          </div>
          <Hint label={collapsed ? "Expand sidebar (⌘B)" : "Collapse sidebar (⌘B)"} side="right">
            <button
              type="button"
              onClick={() => {
                const next = !collapsed;
                setCollapsed(next);
                void setPrefs({ sidebar_collapsed: next });
              }}
              className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          </Hint>
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="border-b border-[var(--border-color)] px-3 py-2">
            {showSearch ? (
              <div className="flex items-center gap-2 rounded-md bg-[var(--surface)] px-2 py-1">
                <Search size={12} className="text-[var(--text-muted)]" aria-hidden="true" />
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
                  placeholder="Search nav…"
                  aria-label="Search navigation"
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
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface)]"
                aria-label="Open sidebar search"
              >
                <span className="flex items-center gap-2">
                  <Search size={12} aria-hidden="true" />
                  <span>Search</span>
                </span>
                <kbd className="font-mono text-[10px]">/</kbd>
              </button>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2">
          {pinnedItems.length > 0 && !query && (
            <SidebarGroup
              label="Pinned"
              items={pinnedItems}
              pathname={pathname}
              collapsed={collapsed}
              pinned={pinned}
              onTogglePin={togglePin}
            />
          )}
          {filtered.map((g) => (
            <SidebarGroup
              key={g.label}
              label={g.label}
              items={g.items}
              pathname={pathname}
              collapsed={collapsed}
              pinned={pinned}
              onTogglePin={togglePin}
            />
          ))}
          {query && filtered.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-[var(--text-muted)]">
              No results
            </div>
          )}
        </nav>

        {/* Sidebar footer — surfaces the shell brand so every authenticated
            page in the console reminds the operator which app they're in.
            Parent/trademark attribution lives on marketing + /legal only. */}
        {!collapsed && (
          <div className="border-t border-[var(--border-color)] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--org-primary)]">
            ATLVS
          </div>
        )}
      </div>

      {/* Resize handle */}
      {!collapsed && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          className="absolute inset-y-0 end-0 w-1 cursor-col-resize hover:bg-[var(--org-primary)]/30 active:bg-[var(--org-primary)]"
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
        />
      )}
    </aside>
  );
}

function SidebarGroup({
  label,
  items,
  pathname,
  collapsed,
  pinned,
  onTogglePin,
}: {
  label: string;
  items: NavItem[];
  pathname?: string | null;
  collapsed: boolean;
  pinned: string[];
  onTogglePin: (href: string) => void;
}) {
  return (
    <div className="mb-3">
      {!collapsed && (
        <div className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {label}
        </div>
      )}
      <ul className="mt-0.5 space-y-0.5">
        {items.map((item) => {
          // Use the unified active-route matcher so portal + mobile + palette
          // all agree. IA spec §1.B / §7 anti-pattern #2.
          const { isActive: active } = matchRoute(pathname ?? "", item.href);
          const isPinned = pinned.includes(item.href);
          return (
            <li key={item.href} className="group relative">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between gap-2 rounded px-2 py-1.5 text-xs transition-colors ${
                  active
                    ? "bg-[var(--surface)] font-medium text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]"
                }`}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-[var(--org-primary)]"
                  />
                )}
                <span className="flex items-center gap-2 truncate ps-1">
                  {collapsed ? (
                    <ChevronRight size={12} className="shrink-0" aria-hidden="true" />
                  ) : null}
                  {!collapsed && <span>{item.label}</span>}
                </span>
                {!collapsed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onTogglePin(item.href);
                    }}
                    aria-label={isPinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
                    className={`shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] ${
                      isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    }`}
                  >
                    {isPinned ? <Pin size={10} /> : <PinOff size={10} />}
                  </button>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
