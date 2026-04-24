"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { matchSorter } from "match-sorter";
import {
  Search,
  ArrowRight,
  Sparkles,
  Plus,
  Settings,
  Moon,
  Sun,
  LogOut,
  FileText,
  Users,
  Briefcase,
  Receipt,
  Package,
  Ticket,
  BookOpen,
  Building2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { platformNav, portalNav, mobileTabs } from "@/lib/nav";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import { registerShortcut } from "@/lib/hooks/useHotkeys";

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon?: React.ComponentType<{ size?: number }>;
  group: "Recent" | "Navigate" | "Create" | "Switch" | "Settings";
  shortcut?: string;
  keywords?: string[];
  /** Primary handler — runs on Enter / Click. */
  perform: () => void;
  /** Optional alt handler (⌘+Enter). */
  performAlt?: () => void;
};

type Scope = "platform" | "portal" | "mobile";

export function CommandPalette({ scope = "platform", portalSlug }: { scope?: Scope; portalSlug?: string }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const router = useRouter();
  const { prefs, setPrefs } = useUserPreferences();
  const recents = React.useMemo(
    () => (prefs.palette_recents ?? []) as string[],
    [prefs.palette_recents],
  );

  // Register shortcut in the cheatsheet registry
  React.useEffect(() => {
    const off = registerShortcut("mod+k", "Open command palette", "Global");
    return off;
  }, []);

  // Cmd/Ctrl+K toggles + ESC close
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = React.useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  const recordRecent = React.useCallback(
    (actionId: string) => {
      const next = [actionId, ...recents.filter((r) => r !== actionId)].slice(0, 10);
      void setPrefs({ palette_recents: next });
    },
    [recents, setPrefs],
  );

  const run = React.useCallback(
    (action: Action, alt = false) => {
      recordRecent(action.id);
      if (alt && action.performAlt) action.performAlt();
      else action.perform();
      close();
    },
    [close, recordRecent],
  );

  const goto = React.useCallback(
    (path: string) => {
      router.push(path);
    },
    [router],
  );

  const gotoNewTab = React.useCallback((path: string) => {
    const url = new URL(path, window.location.origin);
    window.open(url, "_blank", "noopener");
  }, []);

  // Build action registry per scope
  const actions: Action[] = React.useMemo(() => {
    const list: Action[] = [];
    if (scope === "platform") {
      for (const group of platformNav) {
        for (const item of group.items) {
          list.push({
            id: `nav-${item.href}`,
            label: item.label,
            hint: group.label,
            group: "Navigate",
            icon: iconForRoute(item.href),
            perform: () => goto(item.href),
            performAlt: () => gotoNewTab(item.href),
            keywords: [group.label.toLowerCase()],
          });
        }
      }
      [
        { label: "New project", href: "/console/projects/new", icon: Briefcase },
        { label: "New client", href: "/console/clients/new", icon: Users },
        { label: "New invoice", href: "/console/finance/invoices/new", icon: Receipt },
        { label: "New PO", href: "/console/procurement/purchase-orders/new", icon: FileText },
        { label: "New proposal", href: "/console/proposals/new", icon: FileText },
        { label: "Add equipment", href: "/console/equipment/new", icon: Package },
      ].forEach((c) =>
        list.push({
          id: `create-${c.href}`,
          label: c.label,
          group: "Create",
          icon: c.icon,
          perform: () => goto(c.href),
          performAlt: () => gotoNewTab(c.href),
        }),
      );
      list.push({
        id: "nav-ai",
        label: "Open AI assistant",
        group: "Navigate",
        icon: Sparkles,
        perform: () => goto("/console/ai/assistant"),
        performAlt: () => gotoNewTab("/console/ai/assistant"),
        shortcut: "G A",
      });
    } else if (scope === "portal" && portalSlug) {
      for (const persona of ["client", "vendor", "artist", "sponsor", "guest", "crew"] as const) {
        const items = portalNav(portalSlug, persona);
        for (const item of items) {
          list.push({
            id: `portal-${persona}-${item.href}`,
            label: item.label,
            hint: persona,
            group: "Navigate",
            icon: BookOpen,
            perform: () => goto(item.href),
            performAlt: () => gotoNewTab(item.href),
          });
        }
      }
    } else if (scope === "mobile") {
      for (const tab of mobileTabs) {
        list.push({
          id: `m-${tab.href}`,
          label: tab.label,
          group: "Navigate",
          icon: BookOpen,
          perform: () => goto(tab.href),
        });
      }
      list.push({
        id: "m-scan",
        label: "Scan ticket",
        group: "Navigate",
        icon: Ticket,
        perform: () => goto("/m/check-in"),
      });
    }

    // Settings (all scopes)
    list.push(
      {
        id: "settings-profile",
        label: "Edit profile",
        group: "Settings",
        icon: Users,
        perform: () => goto("/me/profile"),
      },
      {
        id: "settings-orgs",
        label: "Switch organization",
        group: "Switch",
        icon: Building2,
        perform: () => goto("/me/organizations"),
      },
      {
        id: "settings-prefs",
        label: "Preferences",
        group: "Settings",
        icon: Settings,
        perform: () => goto("/me/settings"),
      },
      {
        id: "settings-theme-light",
        label: "Switch to light theme",
        group: "Settings",
        icon: Sun,
        perform: () => {
          document.documentElement.setAttribute("data-theme", "light");
          try {
            localStorage.setItem("fbw_theme", "light");
          } catch {
            /* ignore */
          }
        },
      },
      {
        id: "settings-theme-dark",
        label: "Switch to dark theme",
        group: "Settings",
        icon: Moon,
        perform: () => {
          document.documentElement.setAttribute("data-theme", "dark");
          try {
            localStorage.setItem("fbw_theme", "dark");
          } catch {
            /* ignore */
          }
        },
      },
      {
        id: "logout",
        label: "Sign out",
        group: "Settings",
        icon: LogOut,
        perform: () => goto("/auth/signout"),
      },
    );

    return list;
  }, [scope, portalSlug, goto, gotoNewTab]);

  // Build recents list by dereferencing recorded ids
  const recentActions = React.useMemo(() => {
    const byId = new Map(actions.map((a) => [a.id, a]));
    return recents.map((id) => byId.get(id)).filter(Boolean) as Action[];
  }, [recents, actions]);

  // Apply match-sorter fuzzy ranking when there's a query
  const filtered = React.useMemo(() => {
    if (!search.trim()) return null;
    return matchSorter(actions, search, {
      keys: ["label", "hint", { threshold: matchSorter.rankings.CONTAINS, key: "keywords" }],
    });
  }, [actions, search]);

  // Group for display
  const grouped: Record<string, Action[]> = React.useMemo(() => {
    const out: Record<string, Action[]> = {};
    if (filtered) {
      // When searching, keep a flat "Results" group
      out.Results = filtered;
      return out;
    }
    if (recentActions.length) out.Recent = recentActions;
    for (const a of actions) (out[a.group] ||= []).push(a);
    return out;
  }, [actions, filtered, recentActions]);

  // Handle ⌘+Enter for alt action on the highlighted item — cmdk provides a
  // `value` prop on Command.Item via onSelect; we track the last highlighted
  // via a ref so the ⌘+Enter handler can run it.
  const cmdkRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        const el = cmdkRef.current?.querySelector<HTMLElement>("[data-selected=true]");
        const actionId = el?.getAttribute("data-action-id");
        if (!actionId) return;
        const action = actions.find((a) => a.id === actionId);
        if (!action) return;
        e.preventDefault();
        run(action, true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, actions, run]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="lg" hideCloseButton className="p-0" aria-label="Command palette">
        <Command
          ref={cmdkRef}
          label="Command Menu"
          className="flex flex-col"
          shouldFilter={false /* we filter with match-sorter */}
        >
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] px-4 py-3">
            <Search size={16} className="text-[var(--text-muted)]" aria-hidden="true" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search or run a command…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              autoFocus
            />
            <kbd className="hidden rounded border border-[var(--border-color)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] sm:inline-block">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-12 text-center text-sm text-[var(--text-muted)]">
              No results for &quot;{search}&quot;
            </Command.Empty>
            {Object.entries(grouped).map(([group, items]) => (
              <Command.Group
                key={group}
                heading={group}
                className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]"
              >
                {items.map((a) => {
                  const Icon = a.icon ?? (group === "Recent" ? Clock : ArrowRight);
                  return (
                    <Command.Item
                      key={a.id}
                      data-action-id={a.id}
                      value={a.id}
                      onSelect={() => run(a)}
                      className="group flex cursor-pointer items-center gap-3 rounded px-3 py-2 text-sm text-[var(--text-primary)] data-[selected=true]:bg-[var(--surface-inset)]"
                    >
                      <Icon size={14} />
                      <span className="flex-1">{a.label}</span>
                      {a.hint && <span className="text-[11px] text-[var(--text-muted)]">{a.hint}</span>}
                      {a.performAlt && (
                        <span className="hidden items-center gap-1 text-[10px] text-[var(--text-muted)] group-data-[selected=true]:inline-flex">
                          <kbd className="font-mono">⌘↵</kbd>
                          <ExternalLink size={10} aria-hidden="true" />
                        </span>
                      )}
                      {a.shortcut && (
                        <kbd className="rounded border border-[var(--border-color)] px-1 py-0.5 text-[10px] text-[var(--text-muted)]">
                          {a.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>
          <div className="flex items-center justify-between border-t border-[var(--border-color)] px-4 py-2 text-[10px] text-[var(--text-muted)]">
            <span>↑↓ navigate · ↵ select · ⌘↵ open in new tab · esc close</span>
            <span>{actions.length} actions</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function iconForRoute(href: string): React.ComponentType<{ size?: number }> {
  if (href.includes("/projects")) return Briefcase;
  if (href.includes("/clients") || href.includes("/people")) return Users;
  if (href.includes("/finance") || href.includes("/invoice")) return Receipt;
  if (href.includes("/procurement") || href.includes("/equipment")) return Package;
  if (href.includes("/tickets")) return Ticket;
  if (href.includes("/proposals")) return FileText;
  if (href.includes("/guides") || href.includes("/cms")) return BookOpen;
  if (href.includes("/ai")) return Sparkles;
  if (href.includes("/settings") || href.includes("/me")) return Settings;
  return ArrowRight;
}

export function CommandPaletteTrigger() {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
      }}
      className="hidden items-center gap-2 rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-inset)] sm:inline-flex"
      aria-label="Open command palette"
    >
      <Search size={12} />
      <span>Search</span>
      <kbd className="rounded bg-[var(--surface-inset)] px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
    </button>
  );
}

// export Plus as well for consumers
export { Plus };
