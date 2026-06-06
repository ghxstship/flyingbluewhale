"use client";

import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";
import { createCodeAction, revokeCodeAction, type CreateState } from "./actions";
import type { GuideAccessCode } from "@/lib/db/guide-access";
import type { GuidePersona } from "@/lib/supabase/types";

type Redemption = {
  id: string;
  code_id: string;
  persona: GuidePersona;
  redeemed_at: string;
  ip: string | null;
  user_agent: string | null;
  code_label: string | null;
  code_prefix: string;
};

export function AccessCodeManager({
  projectId,
  persona,
  codes,
  redemptions,
}: {
  projectId: string;
  persona: GuidePersona;
  codes: GuideAccessCode[];
  redemptions: Redemption[];
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<CreateState, FormData>(async (prev, fd) => {
    fd.set("persona", persona);
    return createCodeAction(projectId, prev, fd);
  }, null);

  const [revokeBusy, startRevoke] = useTransition();

  const active = codes.filter((c) => !c.revoked_at);
  const revoked = codes.filter((c) => c.revoked_at);

  return (
    <div className="space-y-6">
      {/* Issue new code */}
      <form action={formAction} className="surface space-y-3 p-5">
        <div className="text-sm font-semibold">
          {t("console.projects.guides.access.issueTitle", undefined, "Issue a new code")}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="text-xs text-[var(--text-muted)]">
              {t("console.projects.guides.access.labelField", undefined, "Label")}
            </label>
            <Input
              name="label"
              placeholder={t(
                "console.projects.guides.access.labelPlaceholder",
                undefined,
                "e.g. Crew batch 1, Corazon cast, BA Julia Valler",
              )}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">
              {t("console.projects.guides.access.expiresField", undefined, "Expires in — Days")}
            </label>
            <Input
              name="expires_in_days"
              type="number"
              min={1}
              placeholder={t("console.projects.guides.access.expiresPlaceholder", undefined, "optional")}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)]">
              {t("console.projects.guides.access.maxUsesField", undefined, "Max uses")}
            </label>
            <Input
              name="max_uses"
              type="number"
              min={1}
              placeholder={t("console.projects.guides.access.maxUsesPlaceholder", undefined, "unlimited")}
              inputMode="numeric"
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending} className="w-full">
              {pending
                ? t("console.projects.guides.access.generating", undefined, "Generating…")
                : t("console.projects.guides.access.generate", undefined, "Generate code")}
            </Button>
          </div>
        </div>
        {state && "error" in state && state.error && (
          <div className="text-sm text-[var(--color-error)]">{state.error}</div>
        )}
        {state && "ok" in state && state.ok && (
          <div className="surface-raised space-y-2 border border-[var(--org-primary)]/40 p-4">
            <div className="text-xs tracking-wide text-[var(--text-muted)] uppercase">
              {t("console.projects.guides.access.copyShareEyebrow", undefined, "Copy and share — shown once")}
            </div>
            <div className="font-mono text-xl tracking-[0.25em]">{state.plainCode}</div>
            <div className="text-xs text-[var(--text-muted)]">
              {t(
                "console.projects.guides.access.plaintextNotStored",
                undefined,
                "We don't store the plaintext. Save it now; only the 4-char prefix will appear in the list below.",
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-1"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(state.plainCode);
                }
              }}
            >
              {t("console.projects.guides.access.copyCode", undefined, "Copy code")}
            </Button>
          </div>
        )}
      </form>

      {/* Active codes */}
      <div className="surface space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">
            {t("console.projects.guides.access.activeCodes", undefined, "Active codes")}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {t(
              "console.projects.guides.access.activeRevokedCount",
              { active: active.length, revoked: revoked.length },
              `${active.length} active · ${revoked.length} revoked`,
            )}
          </div>
        </div>
        {active.length === 0 ? (
          <EmptyState
            size="compact"
            title={t("console.projects.guides.access.noCodesIssued", undefined, "No codes issued")}
            description={t(
              "console.projects.guides.access.noCodesDescription",
              undefined,
              "Generate one above to share with this persona group.",
            )}
          />
        ) : (
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.projects.guides.access.colPrefix", undefined, "Prefix")}</th>
                <th>{t("console.projects.guides.access.colLabel", undefined, "Label")}</th>
                <th>{t("console.projects.guides.access.colCreated", undefined, "Created")}</th>
                <th>{t("console.projects.guides.access.colExpires", undefined, "Expires")}</th>
                <th>{t("console.projects.guides.access.colUses", undefined, "Uses")}</th>
                <th aria-label={t("console.projects.guides.access.colActionsAria", undefined, "Actions")} />
              </tr>
            </thead>
            <tbody>
              {active.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono">{c.code_prefix}-…</td>
                  <td>{c.label ?? <span className="text-[var(--text-muted)]">—</span>}</td>
                  <td>{fmtDate(c.created_at)}</td>
                  <td>
                    {c.expires_at ? (
                      fmtDate(c.expires_at)
                    ) : (
                      <span className="text-[var(--text-muted)]">
                        {t("console.projects.guides.access.never", undefined, "never")}
                      </span>
                    )}
                  </td>
                  <td>
                    {c.use_count}
                    {c.max_uses ? ` / ${c.max_uses}` : ""}
                  </td>
                  <td className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={revokeBusy}
                      onClick={() => {
                        if (
                          !confirm(
                            t(
                              "console.projects.guides.access.revokeConfirm",
                              { prefix: c.code_prefix },
                              `Revoke code ${c.code_prefix}-…? Anyone holding it loses access.`,
                            ),
                          )
                        )
                          return;
                        startRevoke(async () => {
                          await revokeCodeAction(projectId, persona, c.id);
                        });
                      }}
                    >
                      {t("console.projects.guides.access.revoke", undefined, "Revoke")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Revoked / expired (collapsed list) */}
      {revoked.length > 0 && (
        <details className="surface p-5">
          <summary className="cursor-pointer text-sm font-semibold">
            {t(
              "console.projects.guides.access.revokedCodesSummary",
              { count: revoked.length },
              `Revoked codes (${revoked.length})`,
            )}
          </summary>
          <table className="data-table mt-3 w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.projects.guides.access.colPrefix", undefined, "Prefix")}</th>
                <th>{t("console.projects.guides.access.colLabel", undefined, "Label")}</th>
                <th>{t("console.projects.guides.access.colRevoked", undefined, "Revoked")}</th>
                <th>{t("console.projects.guides.access.colUses", undefined, "Uses")}</th>
              </tr>
            </thead>
            <tbody>
              {revoked.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono">{c.code_prefix}-…</td>
                  <td>{c.label ?? "—"}</td>
                  <td>{c.revoked_at ? fmtDate(c.revoked_at) : "—"}</td>
                  <td>{c.use_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}

      {/* Redemption log */}
      <div className="surface space-y-3 p-5">
        <div className="text-sm font-semibold">
          {t("console.projects.guides.access.recentRedemptions", undefined, "Recent redemptions")}
        </div>
        {redemptions.length === 0 ? (
          <EmptyState
            size="compact"
            title={t("console.projects.guides.access.noCodeUse", undefined, "No code use")}
            description={t(
              "console.projects.guides.access.noCodeUseDescription",
              undefined,
              "Redemptions will appear here once someone enters a code.",
            )}
          />
        ) : (
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.projects.guides.access.colWhen", undefined, "When")}</th>
                <th>{t("console.projects.guides.access.colCode", undefined, "Code")}</th>
                <th>{t("console.projects.guides.access.colIp", undefined, "IP")}</th>
                <th>{t("console.projects.guides.access.colAgent", undefined, "Agent")}</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDateTime(r.redeemed_at)}</td>
                  <td>
                    <span className="font-mono">{r.code_prefix}-…</span>
                    {r.code_label ? <span className="ms-2 text-[var(--text-muted)]">{r.code_label}</span> : null}
                  </td>
                  <td className="font-mono text-xs">{r.ip ?? "—"}</td>
                  <td className="max-w-[18rem] truncate text-xs text-[var(--text-muted)]">{r.user_agent ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-[var(--text-muted)]">
        <Badge variant="muted">{t("console.projects.guides.access.tipBadge", undefined, "Tip")}</Badge>{" "}
        {t(
          "console.projects.guides.access.tipText",
          undefined,
          "Codes are case-insensitive and dashes are optional when entered. Rotate regularly; revoking is instant.",
        )}
      </div>
    </div>
  );
}

function fmtDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return s;
  }
}

function fmtDateTime(s: string): string {
  try {
    return new Date(s).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}
