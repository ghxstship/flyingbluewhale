"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { FormShell } from "@/components/FormShell";
import { LabeledCheckbox } from "@/components/ui/Checkbox";
import { useT } from "@/lib/i18n/LocaleProvider";
import { BASIS_LABEL, type CompensationBasis } from "@/lib/offer-letters/types";
import { assignPersonAction } from "./actions";

export type PersonOption = { id: string; name: string; role: string | null };
export type RoleOption = { id: string; label: string; department: string | null };
export type RateOption = { id: string; name: string; sku: string; unit_price_cents: number };

const inputCls =
  "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] p-2 text-sm text-[var(--p-text-1)]";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1 text-xs">
      <div className="tracking-wide text-[var(--p-text-2)] uppercase">{label}</div>
      {children}
      {hint ? <div className="text-[11px] text-[var(--p-text-3)]">{hint}</div> : null}
    </label>
  );
}

/**
 * Kit 30 Assign drawer — mounted by the roster page when `?assign=1`.
 * One save creates the engagement (offer letter) via the shared
 * offer-letters mutation lib; the toggle also sends it.
 */
export function AssignDrawer({
  projectId,
  closeHref,
  people,
  roles,
  rates,
  defaultStart,
  defaultEnd,
}: {
  projectId: string;
  closeHref: string;
  people: PersonOption[];
  roles: RoleOption[];
  rates: RateOption[];
  defaultStart: string | null;
  defaultEnd: string | null;
}) {
  const t = useT();
  const action = assignPersonAction.bind(null, projectId);
  const [manual, setManual] = useState(false);
  const [roleId, setRoleId] = useState("");
  const [rateId, setRateId] = useState("");
  const [ratePrefilled, setRatePrefilled] = useState(false);
  const [sendOffer, setSendOffer] = useState(true);

  const rateByRoleLabel = useMemo(() => {
    const map = new Map<string, RateOption>();
    for (const r of rates) map.set(r.name.trim().toLowerCase(), r);
    return map;
  }, [rates]);

  const onRoleChange = (nextRoleId: string) => {
    setRoleId(nextRoleId);
    // Prefill the rate from the catalog row matching the position by name.
    // Editable per engagement: changing the select afterwards overrides it.
    const role = roles.find((r) => r.id === nextRoleId);
    const match = role ? rateByRoleLabel.get(role.label.trim().toLowerCase()) : undefined;
    if (match) {
      setRateId(match.id);
      setRatePrefilled(true);
    } else {
      setRatePrefilled(false);
    }
  };

  const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US")}`;

  return (
    <div className="fixed inset-0 z-[var(--p-z-overlay)]">
      <Link
        href={closeHref}
        aria-label={t("console.projects.roster.assign.close", undefined, "Close")}
        className="absolute inset-0 bg-[var(--overlay-backdrop)] backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("console.projects.roster.assign.title", undefined, "Assign To Project")}
        className="absolute inset-y-0 right-0 z-[var(--p-z-modal)] flex w-full max-w-md flex-col overflow-y-auto border-l border-[var(--p-border)] bg-[var(--p-bg)] shadow-[var(--p-elev-2xl)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--p-border)] px-5 py-4">
          <div>
            <div className="eyebrow">{t("console.projects.roster.assign.eyebrow", undefined, "Project Roster")}</div>
            <h2 className="text-lg font-bold text-[var(--p-text-1)]">
              {t("console.projects.roster.assign.title", undefined, "Assign To Project")}
            </h2>
          </div>
          <Link
            href={closeHref}
            aria-label={t("console.projects.roster.assign.close", undefined, "Close")}
            className="grid size-8 place-items-center rounded-md text-[var(--p-text-3)] hover:bg-[var(--p-surface-2,var(--p-surface))] hover:text-[var(--p-text-1)]"
          >
            <X size={16} />
          </Link>
        </div>
        <div className="flex-1 px-5 py-4">
          <FormShell
            action={action}
            submitLabel={
              sendOffer
                ? t("console.projects.roster.assign.submitSend", undefined, "Assign & Send Offer")
                : t("console.projects.roster.assign.submit", undefined, "Assign Person")
            }
            cancelHref={closeHref}
            className="space-y-4"
          >
            <input type="hidden" name="positionMode" value={manual ? "manual" : "catalog"} />

            <Field label={t("console.projects.roster.assign.person", undefined, "Person")}>
              <select name="crewMemberId" required className={inputCls} defaultValue="">
                <option value="" disabled>
                  {t("console.projects.roster.assign.personPlaceholder", undefined, "Search The Org Directory…")}
                </option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.role ? `${p.name} · ${p.role}` : p.name}
                  </option>
                ))}
              </select>
            </Field>

            {!manual ? (
              <Field
                label={t("console.projects.roster.assign.position", undefined, "Position")}
                hint={t(
                  "console.projects.roster.assign.positionHint",
                  undefined,
                  "Picked from the org's role catalog. Selecting one prefills the rate card.",
                )}
              >
                <select name="roleId" value={roleId} onChange={(e) => onRoleChange(e.target.value)} className={inputCls}>
                  <option value="">
                    {t("console.projects.roster.assign.positionPlaceholder", undefined, "Pick A Position…")}
                  </option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.department ? `${r.label} · ${r.department}` : r.label}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <Field
                label={t("console.projects.roster.assign.manualPosition", undefined, "Position · Manual")}
                hint={t(
                  "console.projects.roster.assign.manualHint",
                  undefined,
                  "Not added to the position catalog.",
                )}
              >
                <input
                  name="manualTitle"
                  className={inputCls}
                  placeholder={t("console.projects.roster.assign.manualPlaceholder", undefined, "e.g. VIP Manager")}
                />
              </Field>
            )}
            <button
              type="button"
              className="text-xs font-semibold text-[var(--p-accent-text)] hover:underline"
              onClick={() => {
                setManual((m) => !m);
                setRoleId("");
                setRatePrefilled(false);
              }}
            >
              {manual
                ? t("console.projects.roster.assign.backToCatalog", undefined, "Back To Catalog")
                : t("console.projects.roster.assign.enterManually", undefined, "Enter Position Manually")}
            </button>

            <Field
              label={t("console.projects.roster.assign.rate", undefined, "Rate Card Item")}
              hint={
                ratePrefilled
                  ? t(
                      "console.projects.roster.assign.ratePrefilled",
                      undefined,
                      "Prefilled from the rate card. Edit to override.",
                    )
                  : undefined
              }
            >
              <select
                name="rateCardItemId"
                value={rateId}
                onChange={(e) => {
                  setRateId(e.target.value);
                  setRatePrefilled(false);
                }}
                className={inputCls}
              >
                <option value="">{t("console.projects.roster.assign.rateNone", undefined, "Set Later")}</option>
                {rates.map((r) => (
                  <option key={r.id} value={r.id}>
                    {`${r.name} · ${money(r.unit_price_cents)}`}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t("console.projects.roster.assign.basis", undefined, "Compensation Basis")}>
              <select name="compensationBasis" defaultValue="per_day" className={inputCls}>
                {(Object.keys(BASIS_LABEL) as CompensationBasis[]).map((b) => (
                  <option key={b} value={b}>
                    {BASIS_LABEL[b]}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("console.projects.roster.assign.start", undefined, "Contract Start")}>
                <input type="date" name="startDate" defaultValue={defaultStart ?? ""} className={inputCls} />
              </Field>
              <Field label={t("console.projects.roster.assign.end", undefined, "Contract End")}>
                <input type="date" name="endDate" defaultValue={defaultEnd ?? ""} className={inputCls} />
              </Field>
            </div>

            <Field
              label={t("console.projects.roster.assign.reportsTo", undefined, "Reports To")}
              hint={t(
                "console.projects.roster.assign.reportsToHint",
                undefined,
                "One edge per engagement. Approvals and escalations follow this line.",
              )}
            >
              <select name="reportsTo" defaultValue="" className={inputCls}>
                <option value="">{t("console.projects.roster.assign.setLater", undefined, "Set Later")}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.role ? `${p.name} · ${p.role}` : p.name}
                  </option>
                ))}
              </select>
            </Field>

            <LabeledCheckbox
              name="sendOffer"
              checked={sendOffer}
              onCheckedChange={(v) => setSendOffer(v === true)}
              label={t("console.projects.roster.assign.sendOffer", undefined, "Send Offer Letter On Save")}
              description={t(
                "console.projects.roster.assign.sendOfferHint",
                undefined,
                "Creates the engagement and the offer in one step.",
              )}
            />
          </FormShell>
        </div>
      </aside>
    </div>
  );
}
