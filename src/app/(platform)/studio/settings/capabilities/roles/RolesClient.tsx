"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { createRole, mergeRoles, renameRole } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
import { useT } from "@/lib/i18n/LocaleProvider";
export type RoleRow = {
  id: string;
  name: string;
  slug: string;
  crewCount: number;
  grants: { capability: string; label: string; shiftDerivable: boolean }[];
};

/**
 * The role catalog editor (backlog P1.2): list, rename, merge.
 *
 * The merge flow is deliberately two-step and side-by-side: `slugify_role()`
 * is never fuzzy, so near-duplicates like "Stage Manager" and "Stage Manager
 * - cosmicMEADOW" are the operator's call — and merging two roles merges
 * their permissions, so both roles' grants are shown together BEFORE the
 * confirm is offered.
 */
export function RolesClient({
  roles,
  canManage,
  canMerge,
}: {
  roles: RoleRow[];
  /** manager+ — create and rename. */
  canManage: boolean;
  /** admin — merge (it moves permission rows). */
  canMerge: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const resolveErr = useActionErrorResolver();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [renames, setRenames] = useState<Record<string, string>>({});

  const run = (fn: (p: null, fd: FormData) => Promise<{ error?: string } | null>, fd: FormData, after?: () => void) => {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await fn(null, fd);
      if (res?.error) {
        setError(resolveErr(res.error));
        return;
      }
      after?.();
      router.refresh();
    });
  };

  const source = roles.find((r) => r.id === sourceId) ?? null;
  const target = roles.find((r) => r.id === targetId) ?? null;
  const comparing = source && target && source.id !== target.id;

  const mergedGrants = comparing
    ? [
        ...target.grants,
        ...source.grants.filter((g) => !target.grants.some((t) => t.capability === g.capability)),
      ]
    : [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert">
          {error}
        </div>
      )}

      {canManage && (
        <div className="surface p-5">
          <h2 className="text-sm font-semibold">
            {t("console.settings.capabilities.roles.addRole", undefined, "Add A Role")}
          </h2>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.settings.capabilities.roles.addRoleDescription",
              undefined,
              "Roles are what capabilities attach to. Add the jobs your crew actually work as.",
            )}
          </p>
          <form className="mt-3 flex flex-wrap items-end gap-3" action={(fd) => run(createRole, fd)}>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[var(--p-text-2)]">
                {t("console.settings.capabilities.roles.fields.name", undefined, "Name")}
              </span>
              <input
                name="name"
                className="ps-input ps-input--sm"
                required
                maxLength={120}
                placeholder={t(
                  "console.settings.capabilities.roles.placeholders.name",
                  undefined,
                  "e.g. Warehouse",
                )}
              />
            </label>
            <Button type="submit" size="sm" disabled={pending}>
              {t("console.settings.capabilities.roles.addRoleSubmit", undefined, "Add role")}
            </Button>
          </form>
        </div>
      )}

      <div className="surface p-5">
        <h2 className="text-sm font-semibold">
          {t("console.settings.capabilities.roles.catalog", undefined, "Catalog")}
        </h2>
        {roles.length === 0 ? (
          <EmptyState
            title={t("console.settings.capabilities.roles.empty", undefined, "No roles yet")}
            description={t(
              "console.settings.capabilities.roles.emptyDescription",
              undefined,
              "Roles appear here as crew members are catalogued, or create the first one above.",
            )}
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">
                    {t("console.settings.capabilities.roles.columns.role", undefined, "Role")}
                  </th>
                  <th className="text-left">
                    {t("console.settings.capabilities.roles.columns.key", undefined, "Key")}
                  </th>
                  <th className="text-right">
                    {t("console.settings.capabilities.roles.columns.crew", undefined, "Crew")}
                  </th>
                  <th className="text-left">
                    {t("console.settings.capabilities.roles.columns.capabilities", undefined, "Capabilities")}
                  </th>
                  {canMerge && (
                    <th className="text-left">
                      {t("console.settings.capabilities.roles.columns.merge", undefined, "Merge")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {canManage ? (
                        <form
                          className="flex items-center gap-2"
                          action={(fd) => run(renameRole, fd, () => setRenames((s) => ({ ...s, [r.id]: "" })))}
                        >
                          <input type="hidden" name="id" value={r.id} />
                          <input
                            name="name"
                            className="ps-input ps-input--sm"
                            value={renames[r.id] || r.name}
                            maxLength={120}
                            required
                            onChange={(e) => setRenames((s) => ({ ...s, [r.id]: e.target.value }))}
                          />
                          {(renames[r.id] ?? r.name) !== r.name && renames[r.id] && (
                            <Button type="submit" size="sm" variant="tertiary" disabled={pending}>
                              {t("console.settings.capabilities.roles.save", undefined, "Save")}
                            </Button>
                          )}
                        </form>
                      ) : (
                        <span className="font-medium">{r.name}</span>
                      )}
                    </td>
                    <td>
                      <code className="font-mono text-xs text-[var(--p-text-3)]">{r.slug}</code>
                    </td>
                    <td className="text-right tabular-nums">{r.crewCount}</td>
                    <td>
                      {r.grants.length === 0 ? (
                        <span className="text-xs text-[var(--p-text-3)]">
                          {t("console.settings.capabilities.roles.none", undefined, "None")}
                        </span>
                      ) : (
                        <span className="flex flex-wrap gap-1">
                          {r.grants.map((g) => (
                            <Badge key={g.capability} variant="brand">
                              {g.label}
                            </Badge>
                          ))}
                        </span>
                      )}
                    </td>
                    {canMerge && (
                      <td>
                        <span className="flex gap-1">
                          <Button
                            size="sm"
                            variant={sourceId === r.id ? "primary" : "tertiary"}
                            disabled={pending || targetId === r.id}
                            onClick={() => setSourceId(sourceId === r.id ? "" : r.id)}
                          >
                            {t("console.settings.capabilities.roles.mergeFrom", undefined, "From")}
                          </Button>
                          <Button
                            size="sm"
                            variant={targetId === r.id ? "primary" : "tertiary"}
                            disabled={pending || sourceId === r.id}
                            onClick={() => setTargetId(targetId === r.id ? "" : r.id)}
                          >
                            {t("console.settings.capabilities.roles.mergeInto", undefined, "Into")}
                          </Button>
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {canMerge && (
        <div className="surface p-5">
          <h2 className="text-sm font-semibold">
            {t("console.settings.capabilities.roles.mergeRoles", undefined, "Merge Roles")}
          </h2>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "console.settings.capabilities.roles.mergeDescription",
              undefined,
              "The catalog never merges roles on its own: near-identical names are still two roles until you say they are one job. Pick the role to retire (From) and the role that absorbs it (Into). Merging moves the crew and combines the permissions.",
            )}
          </p>

          {!comparing ? (
            <p className="mt-3 text-xs text-[var(--p-text-3)]">
              {sourceId || targetId
                ? t(
                    "console.settings.capabilities.roles.pickOtherSide",
                    undefined,
                    "Pick the other side of the merge in the table above.",
                  )
                : t(
                    "console.settings.capabilities.roles.pickBothSides",
                    undefined,
                    "Pick From and Into in the table above.",
                  )}
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="surface-inset p-4">
                  <p className="eyebrow">{t("console.settings.capabilities.roles.retires", undefined, "Retires")}</p>
                  <p className="mt-1 text-sm font-medium">{source.name}</p>
                  <p className="text-xs text-[var(--p-text-3)]">
                    {source.crewCount === 1
                      ? t("console.settings.capabilities.roles.crewMemberOne", undefined, "1 crew member")
                      : t(
                          "console.settings.capabilities.roles.crewMemberMany",
                          { count: source.crewCount },
                          `${source.crewCount} crew members`,
                        )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {source.grants.length === 0 ? (
                      <span className="text-xs text-[var(--p-text-3)]">
                        {t("console.settings.capabilities.roles.noCapabilities", undefined, "No capabilities")}
                      </span>
                    ) : (
                      source.grants.map((g) => (
                        <Badge key={g.capability} variant="warning">
                          {g.label}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                <div className="surface-inset p-4">
                  <p className="eyebrow">{t("console.settings.capabilities.roles.absorbs", undefined, "Absorbs")}</p>
                  <p className="mt-1 text-sm font-medium">{target.name}</p>
                  <p className="text-xs text-[var(--p-text-3)]">
                    {target.crewCount === 1
                      ? t("console.settings.capabilities.roles.crewMemberOne", undefined, "1 crew member")
                      : t(
                          "console.settings.capabilities.roles.crewMemberMany",
                          { count: target.crewCount },
                          `${target.crewCount} crew members`,
                        )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {target.grants.length === 0 ? (
                      <span className="text-xs text-[var(--p-text-3)]">
                        {t("console.settings.capabilities.roles.noCapabilities", undefined, "No capabilities")}
                      </span>
                    ) : (
                      target.grants.map((g) => (
                        <Badge key={g.capability} variant="brand">
                          {g.label}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                <div className="surface-inset p-4">
                  <p className="eyebrow">{t("console.settings.capabilities.roles.result", undefined, "Result")}</p>
                  <p className="mt-1 text-sm font-medium">{target.name}</p>
                  <p className="text-xs text-[var(--p-text-3)]">
                    {t(
                      "console.settings.capabilities.roles.crewMemberMany",
                      { count: source.crewCount + target.crewCount },
                      `${source.crewCount + target.crewCount} crew members`,
                    )}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {mergedGrants.length === 0 ? (
                      <span className="text-xs text-[var(--p-text-3)]">
                        {t("console.settings.capabilities.roles.noCapabilities", undefined, "No capabilities")}
                      </span>
                    ) : (
                      mergedGrants.map((g) => (
                        <Badge key={g.capability} variant="success">
                          {g.label}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {source.grants.some((g) => !target.grants.some((t) => t.capability === g.capability)) && (
                <div className="ps-alert ps-alert--warning" role="status">
                  {t(
                    "console.settings.capabilities.roles.mergeWarning",
                    { target: target.name },
                    `Everyone working ${target.name} gains the capabilities highlighted under Result that ${target.name} did not already grant. That is the point of a merge, and also the thing to check before confirming.`,
                  )}
                </div>
              )}

              <form
                action={(fd) =>
                  run(mergeRoles, fd, () => {
                    setSourceId("");
                    setTargetId("");
                  })
                }
                className="space-y-3"
              >
                <input type="hidden" name="source_id" value={source.id} />
                <input type="hidden" name="target_id" value={target.id} />
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" name="acknowledged" value="1" required className="mt-0.5" />
                  <span>
                    {t(
                      "console.settings.capabilities.roles.mergeAcknowledgement",
                      { source: source.name, target: target.name },
                      `I have reviewed both roles' permissions. ${source.name} will be retired, its crew move to ${target.name}, and the combined capabilities apply to everyone working ${target.name}.`,
                    )}
                  </span>
                </label>
                <Button type="submit" variant="cta" disabled={pending}>
                  {pending
                    ? t("console.settings.capabilities.roles.merging", undefined, "Merging…")
                    : t(
                        "console.settings.capabilities.roles.mergeSubmit",
                        { source: source.name, target: target.name },
                        `Merge ${source.name} into ${target.name}`,
                      )}
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
