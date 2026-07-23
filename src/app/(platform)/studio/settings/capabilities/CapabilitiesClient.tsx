"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { isShiftDerivable } from "@/lib/rbac/capabilities";
import {
  grantRoleCapability,
  grantUserCapability,
  revokeRoleCapability,
  revokeUserCapability,
  setRoleGrantShiftDerivable,
} from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
export type MatrixCell = { grantId: string; shiftDerivable: boolean } | null;

export type MatrixRow = {
  roleId: string;
  roleName: string;
  /** Number of crew currently catalogued under this role. */
  crewCount: number;
  /** capability value → cell, in catalog order. */
  cells: Record<string, MatrixCell>;
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

/**
 * The grant admin controls: the role × capability matrix (P1.1a) and the
 * per-person time-boxed grants (P1.1b). The read-side companions — the
 * "who holds what" view and the enforcement flip — are server-rendered by
 * the page and the enforcement subpage.
 */
export function CapabilitiesClient({
  canEdit,
  catalog,
  matrix,
  members,
  userGrants,
}: {
  canEdit: boolean;
  catalog: CatalogEntry[];
  matrix: MatrixRow[];
  members: { id: string; email: string }[];
  userGrants: UserGrantRow[];
}) {
  const router = useRouter();
  const resolveErr = useActionErrorResolver();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: (p: null, fd: FormData) => Promise<{ error?: string } | null>, fd: FormData) => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await fn(null, fd);
      if (res?.error) {
        setError(resolveErr(res.error));
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

      {/* Role × capability matrix. One glance answers "what does this role
          hand out", one click changes it. */}
      <div className="surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">By Role</h2>
          <a className="text-xs underline text-[var(--p-text-2)]" href="/studio/settings/capabilities/roles">
            Manage the role catalog
          </a>
        </div>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          Everyone working the role gets the capability. Shift cover means anyone rostered onto a shift for the role
          also picks it up for that shift window; credential scanning never derives from a shift.
        </p>

        {matrix.length === 0 ? (
          <p className="mt-4 text-xs text-[var(--p-text-3)]">No roles in the catalog yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Role</th>
                  {catalog.map((c) => (
                    <th key={c.value} className="text-center" title={c.description}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.roleId}>
                    <td>
                      <span className="font-medium">{row.roleName}</span>
                      <span className="ml-2 text-xs text-[var(--p-text-3)]">
                        {row.crewCount === 1 ? "1 crew" : `${row.crewCount} crew`}
                      </span>
                    </td>
                    {catalog.map((c) => {
                      const cell = row.cells[c.value] ?? null;
                      return (
                        <td key={c.value} className="text-center align-middle">
                          {cell ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <button
                                type="button"
                                disabled={!canEdit || pending}
                                title={canEdit ? "Granted. Click to revoke." : "Granted"}
                                className="ps-badge ps-badge--ok cursor-pointer disabled:cursor-default"
                                onClick={() => {
                                  if (!canEdit) return;
                                  const fd = new FormData();
                                  fd.set("id", cell.grantId);
                                  run(revokeRoleCapability, fd);
                                }}
                              >
                                Granted
                              </button>
                              {isShiftDerivable(c.value) && (
                                <label
                                  className="flex items-center gap-1 text-[11px] text-[var(--p-text-3)]"
                                  title="Anyone rostered onto a shift for this role gets the capability for that shift window."
                                >
                                  <input
                                    type="checkbox"
                                    checked={cell.shiftDerivable}
                                    disabled={!canEdit || pending}
                                    onChange={(e) => {
                                      const fd = new FormData();
                                      fd.set("id", cell.grantId);
                                      fd.set("shift_derivable", e.target.checked ? "1" : "");
                                      run(setRoleGrantShiftDerivable, fd);
                                    }}
                                  />
                                  Shift cover
                                </label>
                              )}
                            </div>
                          ) : canEdit ? (
                            <Button
                              size="sm"
                              variant="tertiary"
                              disabled={pending}
                              title={`Grant ${labelFor(c.value)} to ${row.roleName}`}
                              onClick={() => {
                                const fd = new FormData();
                                fd.set("crew_role_id", row.roleId);
                                fd.set("capability", c.value);
                                run(grantRoleCapability, fd);
                              }}
                            >
                              Grant
                            </Button>
                          ) : (
                            <span className="text-[var(--p-text-3)]">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                  <Badge variant={g.live ? "success" : "muted"}>
                    {g.live ? "Active" : g.lapsed ? "Lapsed" : "Scheduled"}
                  </Badge>
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
