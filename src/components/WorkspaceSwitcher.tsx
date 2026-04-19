"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Plus, Building2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";

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

export function WorkspaceSwitcher({
  collapsed,
  initialName,
}: {
  collapsed: boolean;
  initialName?: string;
}) {
  const router = useRouter();
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

  const activeName =
    workspaces.find((w) => w.id === current)?.name ?? initialName ?? "Workspace";

  if (collapsed) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Switch workspace"
            className="flex w-full items-center justify-center rounded p-1 text-[var(--text-muted)] hover:bg-[var(--surface-inset)] hover:text-[var(--text-primary)]"
          >
            <Building2 size={14} aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <WorkspaceMenu
          workspaces={workspaces}
          current={current}
          switching={switching}
          onSwitch={switchTo}
        />
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Switch workspace"
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm font-semibold tracking-tight hover:bg-[var(--surface-inset)]"
        >
          <Building2 size={14} className="shrink-0 text-[var(--text-muted)]" aria-hidden />
          <span className="truncate">{activeName}</span>
          <ChevronsUpDown size={12} className="ms-auto shrink-0 text-[var(--text-muted)]" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <WorkspaceMenu
        workspaces={workspaces}
        current={current}
        switching={switching}
        onSwitch={switchTo}
      />
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
  return (
    <DropdownMenuContent align="start" className="w-64">
      <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
      {workspaces.length === 0 ? (
        <div className="px-2 py-3 text-xs text-[var(--text-muted)]">Loading…</div>
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
              <span className="flex-1 truncate">
                <span className="text-[var(--text-primary)]">{w.name}</span>
                <span className="ml-2 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  {w.role}
                </span>
              </span>
              {isActive && <Check size={12} className="text-[var(--org-primary)]" aria-hidden />}
            </DropdownMenuItem>
          );
        })
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          window.location.href = "/console/settings/organization";
        }}
        className="flex items-center gap-2 text-[var(--text-muted)]"
      >
        <Plus size={12} aria-hidden />
        <span>Manage workspaces</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
