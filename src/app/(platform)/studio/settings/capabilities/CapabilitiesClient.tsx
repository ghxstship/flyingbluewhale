"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  grantRoleCapability,
  grantUserCapability,
  revokeRoleCapability,
  revokeUserCapability,
  setGrantsEnforced,
} from "./actions";

export type RoleGrantRow = {
  id: string;
  capability: string;
  roleName: string;
  shiftDerivable: boolean;
  created: string;
};

export type UserGrantRow = {
  id: string;
  capability: string;
  email: string;
  window: string;
  live: boolean;
  lapsed: boolean;
  reason: string | null;
};

type CatalogEntry = { value: string; label: string; description: string };

export function CapabilitiesClient({
  canEdit,
  enforced,
  catalog,
  roles,
  members,
  roleGrants,
  userGrants,
}: {
  canEdit: boolean;
  enforced: boolean;
  catalog: CatalogEntry[];
  roles: { id: string; name: string }[];
  members: { id: string; email: string }[];
  roleGrants: RoleGrantRow[];
  userGrants: UserGrantRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: (p: null, fd: FormData) => Promise<{ error?: string } | null>, fd: FormData) => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await fn(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const labelFor = (c: string) => catalog.find((x) => x.value === c)?.label ?? c;

  return (
    <div className="space-y-6">
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert">
          {error}
        </div>
      )}

      {/* Enforcement. Deliberately first and deliberately blunt: this is the
          switch that can lock the field out, and an operator should meet the
          consequence before the controls, not after. */}
      <div className="surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-sm font-semibold">Enforcement</h2>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {enforced
                ? "Grants are live. People hold what their role gives them, plus what is granted below, and nothing else."
                : "Grants are not enforced yet. Everyone who can scan today still scans everything, so nothing below has bitten. Configure the grants you want first, then turn this on."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={enforced ? "success" : "muted"}>{enforced ? "Enforced" : "Grandfathered"}</Badge>
            {canEdit && (
              <Button
                size="sm"
                variant={enforced ? "tertiary" : "cta"}
                disabled={pending}
                onClick={() => {
                  const fd = new FormData();
                  fd.set("enforced", enforced ? "" : "1");
                  run(setGrantsEnforced, fd);
                }}
              >
                {enforced ? "Turn Off" : "Turn On"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Role grants. */}
      <div className="surface p-5">
        <h2 className="text-sm font-semibold">By Role</h2>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          Everyone working this role gets the capability. This is the usual way to turn a feature on for a crew.
        </p>

        {canEdit && roles.length > 0 && (
          <form
            className="mt-4 flex flex-wrap items-end gap-3"
            action={(fd) => run(grantRoleCapability, fd)}
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--p-text-2)]">Role</span>
              <select name="crew_role_id" className="ps-input ps-input--sm" required>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--p-text-2)]">Capability</span>
              <select name="capability" className="ps-input ps-input--sm" required>
                {catalog.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pb-2 text-xs">
              <input type="checkbox" name="shift_derivable" value="1" />
              {/* The scheduler becomes an authorization surface when this is on
                  — worth saying in the UI, not just the ADR. */}
              <span title="Anyone rostered onto a shift for this role gets the capability for that shift.">
                Also while covering a shift
              </span>
            </label>
            <Button type="submit" size="sm" disabled={pending}>
              Grant
            </Button>
          </form>
        )}

        <div className="mt-4">
          {roleGrants.length === 0 ? (
            <p className="text-xs text-[var(--p-text-3)]">No role grants yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--p-border)]">
              {roleGrants.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="text-sm font-medium">{g.roleName}</span>
                  <Badge variant="brand">{labelFor(g.capability)}</Badge>
                  {g.shiftDerivable && <Badge variant="muted">Shift cover too</Badge>}
                  <span className="ml-auto text-xs text-[var(--p-text-3)]">{g.created}</span>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="tertiary"
                      disabled={pending}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("id", g.id);
                        run(revokeRoleCapability, fd);
                      }}
                    >
                      Revoke
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Individual grants. */}
      <div className="surface p-5">
        <h2 className="text-sm font-semibold">By Person</h2>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          One person, optionally for a set window. This is the cover-shift case: someone has the cage tonight and not
          tomorrow.
        </p>

        {canEdit && members.length > 0 && (
          <form className="mt-4 flex flex-wrap items-end gap-3" action={(fd) => run(grantUserCapability, fd)}>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--p-text-2)]">Person</span>
              <select name="user_id" className="ps-input ps-input--sm" required>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--p-text-2)]">Capability</span>
              <select name="capability" className="ps-input ps-input--sm" required>
                {catalog.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--p-text-2)]">From</span>
              <input type="datetime-local" name="valid_from" className="ps-input ps-input--sm" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--p-text-2)]">Until</span>
              <input type="datetime-local" name="valid_until" className="ps-input ps-input--sm" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--p-text-2)]">Reason</span>
              <input
                name="reason"
                className="ps-input ps-input--sm"
                maxLength={500}
                placeholder="e.g. covering Dana"
              />
            </label>
            <Button type="submit" size="sm" disabled={pending}>
              Grant
            </Button>
          </form>
        )}

        <div className="mt-4">
          {userGrants.length === 0 ? (
            <p className="text-xs text-[var(--p-text-3)]">No individual grants.</p>
          ) : (
            <ul className="divide-y divide-[var(--p-border)]">
              {userGrants.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="text-sm font-medium">{g.email}</span>
                  <Badge variant="brand">{labelFor(g.capability)}</Badge>
                  {/* A row can exist and not be live. Saying "Active" for a
                      lapsed grant is how an operator concludes the permission
                      system is broken. */}
                  <Badge variant={g.live ? "success" : "muted"}>{g.live ? "Active" : g.lapsed ? "Lapsed" : "Scheduled"}</Badge>
                  <span className="text-xs text-[var(--p-text-3)]">{g.window}</span>
                  {g.reason && <span className="text-xs text-[var(--p-text-2)]">{g.reason}</span>}
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="tertiary"
                      className="ml-auto"
                      disabled={pending}
                      onClick={() => {
                        const fd = new FormData();
                        fd.set("id", g.id);
                        run(revokeUserCapability, fd);
                      }}
                    >
                      Revoke
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
