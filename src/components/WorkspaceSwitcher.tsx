"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Initials-fallback tile palette — workspace identity discriminator.
 *
 * 8 hash buckets so each org gets a stable color across sessions even
 * before `logoUrl` loads. The set MUST be visually distinct enough that
 * users tell workspaces apart at a glance.
 *
 * Per the v3 kit ratification (tokens.json#tokenSourceOfTruth): every
 * paint resolves from CSS vars on the SaaS skin. These 8 are CSS-var
 * references; the values live in atlvs-product.css `--p-avatar-1..8`
 * so a future tenant-branding pass can override the discriminator
 * without touching this component. Each value picks WCAG-AA-legible
 * white text contrast at 600+ weight per its own contrast audit.
 */
const TILE_PALETTE = [
  "var(--p-avatar-1)",
  "var(--p-avatar-2)",
  "var(--p-avatar-3)",
  "var(--p-avatar-4)",
  "var(--p-avatar-5)",
  "var(--p-avatar-6)",
  "var(--p-avatar-7)",
  "var(--p-avatar-8)",
];

function tileColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return TILE_PALETTE[Math.abs(h) % TILE_PALETTE.length]!;
}

function tileInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) return "?";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1]!;
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

/**
 * <WorkspaceTile> — square avatar tile for a workspace.
 * Logo image when present, else initials on a hash-derived color.
 * Squares (not circles) — circles are reserved for user avatars per
 * Linear/Vercel/GitHub convention.
 */
function WorkspaceTile({ name, logoUrl, size = 28 }: { name: string; logoUrl: string | null; size?: number }) {
  const radius = Math.max(4, Math.round(size * 0.22));
  if (logoUrl) {
    return (
      <span
        className="shrink-0 overflow-hidden bg-[var(--p-surface-2)]"
        style={{ width: size, height: size, borderRadius: radius }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center leading-none font-semibold text-white"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: tileColor(name),
        fontSize: Math.round(size * 0.4),
      }}
      aria-hidden
    >
      {tileInitials(name)}
    </span>
  );
}

/**
 * <WorkspaceSwitcher> — top-of-sidebar dropdown for multi-tenant users.
 * Vercel / Linear / Supabase pattern: truncated current workspace name +
 * chevron; click opens a list of every membership, with a "New workspace"
 * row at the bottom. See docs/ia/02-navigation-redesign.md §7 #12.
 *
 * Data: fetched from `/api/v1/me/workspaces` on first open (lazy — zero
 * cost for single-org users). Switching PATCHes the endpoint, then calls
 * `router.refresh()` so server components re-resolve via `resolveTenant`.
 */

type Workspace = { id: string; name: string; role: string; logoUrl: string | null };

export function WorkspaceSwitcher({ collapsed, initialName }: { collapsed: boolean; initialName?: string }) {
  const router = useRouter();
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [current, setCurrent] = React.useState<string | null>(null);
  const [switching, setSwitching] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (loaded) return;
    try {
      const res = await fetch("/api/v1/me/workspaces");
      const json = await res.json();
      if (json?.ok) {
        setWorkspaces(json.data.workspaces ?? []);
        setCurrent(json.data.current ?? null);
      }
    } finally {
      setLoaded(true);
    }
  }, [loaded]);

  React.useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function switchTo(id: string) {
    if (id === current) {
      setOpen(false);
      return;
    }
    setSwitching(id);
    try {
      const res = await fetch("/api/v1/me/workspaces", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orgId: id }),
      });
      const json = await res.json();
      if (json?.ok) {
        setCurrent(id);
        setOpen(false);
        router.refresh();
      }
    } finally {
      setSwitching(null);
    }
  }

  const active = workspaces.find((w) => w.id === current);
  const activeName = active?.name ?? initialName ?? t("workspace.fallbackName", undefined, "Workspace");
  const activeLogoUrl = active?.logoUrl ?? null;
  const switchAriaLabel = t(
    "workspace.switchAriaLabel",
    { name: activeName },
    `Switch workspace (current: ${activeName})`,
  );

  if (collapsed) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={switchAriaLabel}
            className="flex w-full items-center justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--p-accent)]"
          >
            <WorkspaceTile name={activeName} logoUrl={activeLogoUrl} size={28} />
          </button>
        </DropdownMenuTrigger>
        <WorkspaceMenu workspaces={workspaces} current={current} switching={switching} onSwitch={switchTo} />
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={switchAriaLabel}
          className="flex w-full items-center gap-2 rounded px-1 py-1 text-sm font-semibold tracking-tight hover:bg-[var(--p-surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)]"
        >
          <WorkspaceTile name={activeName} logoUrl={activeLogoUrl} size={24} />
          <span className="truncate">{activeName}</span>
          <ChevronsUpDown size={12} className="ms-auto shrink-0 text-[var(--p-text-2)]" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <WorkspaceMenu workspaces={workspaces} current={current} switching={switching} onSwitch={switchTo} />
    </DropdownMenu>
  );
}

function WorkspaceMenu({
  workspaces,
  current,
  switching,
  onSwitch,
}: {
  workspaces: Workspace[];
  current: string | null;
  switching: string | null;
  onSwitch: (id: string) => void;
}) {
  const t = useT();
  return (
    <DropdownMenuContent align="start" className="w-64">
      <DropdownMenuLabel>{t("workspace.menuLabel", undefined, "Workspaces")}</DropdownMenuLabel>
      {workspaces.length === 0 ? (
        <div className="px-2 py-3 text-xs text-[var(--p-text-2)]">{t("common.loading", undefined, "Loading…")}</div>
      ) : (
        workspaces.map((w) => {
          const isActive = w.id === current;
          return (
            <DropdownMenuItem
              key={w.id}
              onSelect={(e) => {
                e.preventDefault();
                onSwitch(w.id);
              }}
              disabled={switching === w.id}
              className="flex items-center gap-2"
            >
              <WorkspaceTile name={w.name} logoUrl={w.logoUrl} size={20} />
              <span className="flex-1 truncate">
                <span className="text-[var(--p-text-1)]">{w.name}</span>
                <span className="ms-2 text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">{w.role}</span>
              </span>
              {isActive && <Check size={12} className="text-[var(--p-accent)]" aria-hidden />}
            </DropdownMenuItem>
          );
        })
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          window.location.href = "/console/settings/organization";
        }}
        className="flex items-center gap-2 text-[var(--p-text-2)]"
      >
        <Plus size={12} aria-hidden />
        <span>{t("workspace.manage", undefined, "Manage workspaces")}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
