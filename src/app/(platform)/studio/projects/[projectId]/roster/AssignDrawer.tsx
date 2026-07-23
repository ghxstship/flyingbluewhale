"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FormShell } from "@/components/FormShell";
import { LabeledCheckbox } from "@/components/ui/Checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { useT, useFormatters } from "@/lib/i18n/LocaleProvider";
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
  const f = useFormatters();
  const router = useRouter();
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

  const money = (cents: number) => f.money(cents);

  return (
    /* W6 a11y refit — the shared Radix Sheet primitive supplies the scrim,
       Escape-to-close, focus trap + restore, and the ✕ control; closing
       navigates back to the roster URL (the drawer mounts off `?assign=1`). */
    <Sheet open onOpenChange={(o) => (!o ? router.push(closeHref) : null)}>
      <SheetContent side="right" aria-label={t("console.projects.roster.assign.title", undefined, "Assign To Project")}>
        <SheetHeader>
          <div className="eyebrow">{t("console.projects.roster.assign.eyebrow", undefined, "Project Roster")}</div>
          <SheetTitle>{t("console.projects.roster.assign.title", undefined, "Assign To Project")}</SheetTitle>
        </SheetHeader>
        <div className="flex-1">
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
      </SheetContent>
    </Sheet>
  );
}
