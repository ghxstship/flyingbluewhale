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
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import {
  platformNav,
  platformUtility,
  portalNav,
  mobileTabs,
  mobileSurfaces,
  settingsNav,
  PORTAL_PERSONAS,
  type NavItem,
  type PortalPersona,
} from "@/lib/nav";
import { navItemKey } from "@/lib/i18n/nav-label";
import { CONSOLE_CREATE_ACTIONS } from "@/lib/studio/create-actions.generated";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import { registerShortcut } from "@/lib/hooks/useHotkeys";
import { useT } from "@/lib/i18n/LocaleProvider";

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon?: React.ComponentType<{ size?: number }>;
  group: "Recent" | "Navigate" | "Request" | "Create" | "Switch" | "Settings";
  shortcut?: string;
  keywords?: string[];
  /** Primary handler — runs on Enter / Click. */
  perform: () => void;
  /** Optional alt handler (⌘+Enter). */
  performAlt?: () => void;
};

type Scope = "platform" | "portal" | "mobile";

export function CommandPalette({
  scope = "platform",
  portalSlug,
  portalPersona,
}: {
  scope?: Scope;
  portalSlug?: string;
  /** Viewer's portal sub-persona — scopes the portal index to their own
   *  rail. Omit for operators previewing portals: all personas index. */
  portalPersona?: PortalPersona;
}) {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const router = useRouter();
  const { prefs, setPrefs } = useUserPreferences();
  const recents = React.useMemo(() => (prefs.palette_recents ?? []) as string[], [prefs.palette_recents]);

  // Register shortcut in the cheatsheet registry
  React.useEffect(() => {
    const off = registerShortcut("mod+k", t("commandPalette.shortcut", undefined, "Open command palette"), "Global");
    return off;
  }, [t]);

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
      // Domain-nav groups keep their items in `sections` with `items: []`
      // (ADR-0006) — flatten both shapes so the palette indexes the full
      // route surface, not just the flat-items Dashboard group. Dedupe by
      // href so a route listed in two groups yields one command.
      const seen = new Set<string>();
      const pushNav = (item: NavItem, hint: string, keywords: string[]) => {
        if (seen.has(item.href)) return;
        seen.add(item.href);
        list.push({
          id: `nav-${item.href}`,
          label: t(navItemKey(item), undefined, item.label),
          hint,
          group: "Navigate",
          icon: iconForRoute(item.href),
          perform: () => goto(item.href),
          performAlt: () => gotoNewTab(item.href),
          keywords,
        });
      };
      for (const group of platformNav) {
        for (const item of group.items) {
          pushNav(item, group.label, [group.label.toLowerCase()]);
        }
        for (const section of group.sections ?? []) {
          for (const item of section.items) {
            pushNav(item, `${group.label} · ${section.label}`, [
              group.label.toLowerCase(),
              section.label.toLowerCase(),
            ]);
          }
        }
      }
      // Kit 20: surfaces the verbatim rail does not carry stay one ⌘K away —
      // platformUtility is their discoverability home (nav.ts).
      for (const item of platformUtility) {
        pushNav(item, "Utility", ["utility"]);
      }
      // Settings items are not in the primary sidebar but should still be
      // searchable from anywhere — that's the whole point of ⌘K when admin
      // moves out of the sidebar (docs/ia/03-ia-compression-proposal.md).
      for (const group of settingsNav) {
        for (const item of group.items) {
          list.push({
            id: `settings-${item.href}`,
            label: t(navItemKey(item), undefined, item.label),
            hint: t("commandPalette.hint.settings", { group: group.label }, `Settings · ${group.label}`),
            group: "Navigate",
            icon: iconForRoute(item.href),
            perform: () => goto(item.href),
            performAlt: () => gotoNewTab(item.href),
            keywords: ["settings", group.label.toLowerCase()],
          });
        }
      }
      // Create group — every static /studio/**/new route, auto-derived from
      // the route tree (workflow audit F-A, src/lib/studio/create-actions.
      // generated.ts). The six highest-traffic creates keep their hand-tuned
      // i18n labels + icons; the long tail uses generated labels + a generic
      // Plus icon so EVERY dataset is a 2-keystroke create regardless of nav
      // depth. Project-scoped creates (need a picker) are intentionally excluded.
      const curatedCreate: Record<string, { key: string; icon: typeof Briefcase }> = {
        "/studio/projects/new": { key: "newProject", icon: Briefcase },
        "/studio/clients/new": { key: "newClient", icon: Users },
        "/studio/finance/invoices/new": { key: "newInvoice", icon: Receipt },
        "/studio/procurement/purchase-orders/new": { key: "newPo", icon: FileText },
        "/studio/proposals/new": { key: "newProposal", icon: FileText },
        "/studio/production/equipment/new": { key: "addEquipment", icon: Package },
      };
      // Request group (v7.8 One Front Door) — mirrors the global "+" menu's
      // Request-first section so ⌘K teaches the same five intakes.
      const requestActions: Array<{ id: string; key: string; label: string; href: string }> = [
        {
          id: "request-advance",
          key: "gearAdvance",
          label: "Gear & Advance Request",
          href: "/studio/advancing/request",
        },
        {
          id: "request-requisition",
          key: "requisition",
          label: "Purchase Requisition",
          href: "/studio/procurement/requisitions/new",
        },
        { id: "request-time-off", key: "timeOff", label: "Time Off", href: "/studio/workforce/time-off" },
        {
          id: "request-report-it",
          key: "reportIt",
          label: "Report It · Incident / Medical / Lost",
          href: "/studio/operations/incidents/new",
        },
        {
          id: "request-it-ticket",
          key: "itTicket",
          label: "IT & Facilities Ticket",
          href: "/studio/services/requests/new",
        },
      ];
      for (const r of requestActions) {
        list.push({
          id: r.id,
          label: t(`createMenu.request.${r.key}`, undefined, r.label),
          hint: t("commandPalette.hint.request", undefined, "Request · One Front Door"),
          group: "Request",
          icon: Plus,
          perform: () => goto(r.href),
          performAlt: () => gotoNewTab(r.href),
          keywords: ["request", "ask", "new"],
        });
      }
      for (const c of CONSOLE_CREATE_ACTIONS) {
        const cur = curatedCreate[c.href];
        list.push({
          id: `create-${c.href}`,
          label: cur ? t(`commandPalette.actions.${cur.key}`, undefined, c.label) : c.label,
          hint: t("commandPalette.hint.create", { group: c.group }, `Create · ${c.group}`),
          group: "Create",
          icon: cur?.icon ?? Plus,
          perform: () => goto(c.href),
          performAlt: () => gotoNewTab(c.href),
          keywords: ["new", "create", c.group.toLowerCase()],
        });
      }
      // Scan-code linker — a create-shaped action that isn't a /new route.
      list.push({
        id: "create-asset-linker",
        label: t("commandPalette.actions.linkScanCode", undefined, "Link Scan Code"),
        hint: t("commandPalette.hint.create", { group: "People" }, "Create · People"),
        group: "Create",
        icon: Ticket,
        perform: () => goto("/studio/people/credentials/asset-linker"),
        performAlt: () => gotoNewTab("/studio/people/credentials/asset-linker"),
      });
    } else if (scope === "portal" && portalSlug) {
      // Scope the index to the viewer's own persona when the chrome knows
      // it; operators previewing portals get every persona's routes for
      // the current slug.
      const personas: readonly PortalPersona[] = portalPersona ? [portalPersona] : PORTAL_PERSONAS;
      // Workspace items (Guide, Updates, Inbox, …) share one slug-level
      // URL across personas — dedupe by href so the all-personas fallback
      // doesn't repeat them 15 times.
      const seen = new Set<string>();
      for (const persona of personas) {
        // ADR-0005: portalNav now returns a NavGroup with sections —
        // flatten the sections back to a flat command list for ⌘K.
        const group = portalNav(portalSlug, persona);
        const items = group.sections?.flatMap((s) => s.items) ?? group.items;
        for (const item of items) {
          if (seen.has(item.href)) continue;
          seen.add(item.href);
          list.push({
            id: `portal-${persona}-${item.href}`,
            label: t(navItemKey(item), undefined, item.label),
            hint: persona,
            group: "Navigate",
            icon: BookOpen,
            perform: () => goto(item.href),
            performAlt: () => gotoNewTab(item.href),
          });
        }
      }
    } else if (scope === "mobile") {
      // Tab bar surfaces (5) — the always-visible bottom nav.
      for (const tab of mobileTabs) {
        list.push({
          id: `m-tab-${tab.href}`,
          label: t(navItemKey(tab), undefined, tab.label),
          hint: t("commandPalette.hint.tab", undefined, "Tab"),
          group: "Navigate",
          icon: BookOpen,
          perform: () => goto(tab.href),
        });
      }
      // Tools surfaces (19) — previously dead routes reachable only by
      // deep link. Phase D of the WAYFINDER remediation indexes them so
      // cmd-K covers the full mobile surface area.
      for (const surface of mobileSurfaces) {
        list.push({
          id: `m-surface-${surface.href}`,
          label: t(navItemKey(surface), undefined, surface.label),
          hint: t("commandPalette.hint.tool", undefined, "Tool"),
          group: "Navigate",
          icon: BookOpen,
          perform: () => goto(surface.href),
        });
      }
      list.push({
        id: "m-create-incident",
        label: t("commandPalette.actions.reportIncident", undefined, "Report Incident"),
        group: "Create",
        icon: Ticket,
        perform: () => goto("/m/incidents/new"),
      });
      list.push({
        id: "m-create-medic",
        label: t("commandPalette.actions.logMedical", undefined, "Log Medical Event"),
        group: "Create",
        icon: Ticket,
        perform: () => goto("/m/incidents/new"),
      });
      list.push({
        id: "m-create-request",
        label: t("commandPalette.actions.openRequest", undefined, "Open Request"),
        group: "Create",
        icon: Ticket,
        perform: () => goto("/m/requests/new"),
      });
    }

    // Settings (all scopes)
    list.push(
      {
        id: "settings-profile",
        label: t("commandPalette.actions.editProfile", undefined, "Edit Profile"),
        group: "Settings",
        icon: Users,
        perform: () => goto("/me/profile"),
      },
      {
        id: "settings-orgs",
        label: t("commandPalette.actions.switchOrg", undefined, "Switch Organization"),
        group: "Switch",
        icon: Building2,
        perform: () => goto("/me/organizations"),
      },
      {
        id: "settings-prefs",
        label: t("commandPalette.actions.preferences", undefined, "Preferences"),
        group: "Settings",
        icon: Settings,
        perform: () => goto("/me/settings"),
      },
      {
        id: "settings-mode-light",
        label: t("commandPalette.actions.lightMode", undefined, "Switch to Light Mode"),
        group: "Settings",
        icon: Sun,
        perform: () => {
          // Color mode is `data-mode`, separate from the theme palette
          // (`data-theme`). The canonical writer is ThemeProvider.setMode,
          // but the command palette can't hook into that without a context
          // boundary refactor — so write the cookie + localStorage pair
          // directly using the same names the bootstrap script reads.
          document.documentElement.setAttribute("data-mode", "light");
          try {
            localStorage.setItem("chroma.mode", "light");
          } catch {
            /* ignore */
          }
          document.cookie = `atlvs_mode=light; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`;
        },
      },
      {
        id: "settings-mode-dark",
        label: t("commandPalette.actions.darkMode", undefined, "Switch to Dark Mode"),
        group: "Settings",
        icon: Moon,
        perform: () => {
          document.documentElement.setAttribute("data-mode", "dark");
          try {
            localStorage.setItem("chroma.mode", "dark");
          } catch {
            /* ignore */
          }
          document.cookie = `atlvs_mode=dark; max-age=${60 * 60 * 24 * 365}; path=/; samesite=lax`;
        },
      },
      {
        id: "logout",
        label: t("commandPalette.actions.signOut", undefined, "Sign Out"),
        group: "Settings",
        icon: LogOut,
        perform: () => goto("/auth/signout"),
      },
    );

    return list;
  }, [scope, portalSlug, portalPersona, goto, gotoNewTab, t]);

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
      <DialogContent size="lg" hideCloseButton className="p-0">
        {/* Radix requires a Title (and looks for a Description) descendant for
            an accessible name; the palette has no visible heading, so render
            both visually hidden. */}
        <DialogTitle className="sr-only">{t("commandPalette.title", undefined, "Command Palette")}</DialogTitle>
        <DialogDescription className="sr-only">
          {t("commandPalette.description", undefined, "Search for pages and run commands.")}
        </DialogDescription>
        <Command
          ref={cmdkRef}
          label={t("commandPalette.menuLabel", undefined, "Command Menu")}
          className="flex flex-col"
          shouldFilter={false /* we filter with match-sorter */}
        >
          <div className="flex items-center gap-2 border-b border-[var(--p-border)] px-4 py-3">
            <Search size={16} className="text-[var(--p-text-2)]" aria-hidden="true" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder={t("commandPalette.placeholder", undefined, "Search or run a command…")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--p-text-2)]"
              autoFocus
            />
            <kbd className="hidden rounded border border-[var(--p-border)] px-1.5 py-0.5 text-[10px] text-[var(--p-text-2)] sm:inline-block">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-12 text-center text-sm text-[var(--p-text-2)]">
              {t("commandPalette.noResults", { query: search }, `No results for "${search}"`)}
            </Command.Empty>
            {Object.entries(grouped).map(([group, items]) => (
              <Command.Group
                key={group}
                heading={t(`commandPalette.groups.${group.toLowerCase()}`, undefined, group)}
                className="eyebrow"
              >
                {items.map((a) => {
                  const Icon = a.icon ?? (group === "Recent" ? Clock : ArrowRight);
                  return (
                    <Command.Item
                      key={a.id}
                      data-action-id={a.id}
                      value={a.id}
                      onSelect={() => run(a)}
                      className="group flex cursor-pointer items-center gap-3 rounded px-3 py-2 text-sm text-[var(--p-text-1)] data-[selected=true]:bg-[var(--p-surface-2)]"
                    >
                      <Icon size={14} />
                      <span className="flex-1">{a.label}</span>
                      {a.hint && <span className="text-[11px] text-[var(--p-text-2)]">{a.hint}</span>}
                      {a.performAlt && (
                        <span className="hidden items-center gap-1 text-[10px] text-[var(--p-text-2)] group-data-[selected=true]:inline-flex">
                          <kbd className="font-mono">⌘↵</kbd>
                          <ExternalLink size={10} aria-hidden="true" />
                        </span>
                      )}
                      {a.shortcut && (
                        <kbd className="rounded border border-[var(--p-border)] px-1 py-0.5 text-[10px] text-[var(--p-text-2)]">
                          {a.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>
          <div className="flex items-center justify-between border-t border-[var(--p-border)] px-4 py-2 text-[10px] text-[var(--p-text-2)]">
            <span>
              {t("commandPalette.footerHint", undefined, "↑↓ navigate · ↵ select · ⌘↵ open in new tab · esc close")}
            </span>
            <span>{t("commandPalette.actionCount", { count: actions.length }, `${actions.length} actions`)}</span>
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
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
      }}
      className="hidden items-center gap-2 rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-2.5 py-1 text-xs text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)] sm:inline-flex"
      aria-label={t("commandPalette.shortcut", undefined, "Open command palette")}
    >
      <Search size={12} />
      <span>{t("commandPalette.searchLabel", undefined, "Search")}</span>
      <kbd className="rounded bg-[var(--p-surface-2)] px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
    </button>
  );
}

// export Plus as well for consumers
export { Plus };
