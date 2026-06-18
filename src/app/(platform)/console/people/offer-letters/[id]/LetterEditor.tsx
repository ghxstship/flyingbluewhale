"use client";

import { FormShell, type FormState } from "@/components/FormShell";
import { FormField, TextInput, TextArea, NativeSelect } from "@/components/forms/FormField";
import type {
  OfferLetter,
  OfferLetterResolved,
  CrewMemberOption,
  OrgRoleOption,
  VenueOption,
  RateCardOption,
} from "@/lib/offer-letters/types";
import { useFormatters, useT } from "@/lib/i18n/LocaleProvider";
import { saveLetter } from "./actions";

export function LetterEditor({
  raw,
  resolved,
  crew,
  roles,
  venues,
  rates,
}: {
  raw: OfferLetter;
  resolved: OfferLetterResolved;
  crew: CrewMemberOption[];
  roles: OrgRoleOption[];
  venues: VenueOption[];
  rates: RateCardOption[];
}) {
  const action = async (prev: FormState, fd: FormData) => {
    const r = await saveLetter(raw.id, prev as never, fd);
    return r as FormState;
  };

  const { money } = useFormatters();
  const t = useT();
  const isLocked = raw.status !== "draft";

  return (
    <section className="surface space-y-1 p-1">
      <div className="px-5 pt-5">
        <h3 className="text-sm font-semibold tracking-wider uppercase">
          {t("console.people.offerLetters.editor.title", undefined, "Edit Letter")}
        </h3>
        <p className="mt-1 text-xs text-[var(--p-text-2)]">
          {t(
            "console.people.offerLetters.editor.intro",
            undefined,
            "All fields reference canonical SSOT records. Empty boolean / override = inherit from org defaults or rate card.",
          )}
        </p>
        {isLocked && (
          <p className="mt-1 text-xs text-[var(--p-warning)]">
            {t(
              "console.people.offerLetters.editor.lockedNotice",
              { status: raw.status },
              `This letter is ${raw.status}. Edits are disabled — the snapshot is frozen.`,
            )}
          </p>
        )}
      </div>
      <fieldset disabled={isLocked} className="space-y-0">
        <FormShell
          action={action}
          submitLabel={t("console.people.offerLetters.editor.submit", undefined, "Save Changes")}
          className="space-y-6 p-5"
        >
          {/* ── IDENTITY ─────────────────────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.people.offerLetters.editor.identity.legend", undefined, "Identity & Position")}
            </legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                name="crew_member_id"
                label={t("console.people.offerLetters.editor.identity.recipient", undefined, "Recipient")}
                required
              >
                <NativeSelect name="crew_member_id" defaultValue={raw.crew_member_id}>
                  {crew.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `· ${c.email}` : ""}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField
                name="role_id"
                label={t("console.people.offerLetters.editor.identity.role", undefined, "Role")}
                required
              >
                <NativeSelect name="role_id" defaultValue={raw.role_id}>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} {r.department ? `· ${r.department}` : ""}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField
                name="reports_to_crew_member_id"
                label={t("console.people.offerLetters.editor.identity.reportsTo", undefined, "Reports To")}
              >
                <NativeSelect name="reports_to_crew_member_id" defaultValue={raw.reports_to_crew_member_id ?? ""}>
                  <option value="">
                    {t("console.people.offerLetters.editor.identity.none", undefined, "— None —")}
                  </option>
                  {crew.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField
                name="venue_id"
                label={t("console.people.offerLetters.editor.identity.venue", undefined, "Venue")}
              >
                <NativeSelect name="venue_id" defaultValue={raw.venue_id ?? ""}>
                  <option value="">
                    {t("console.people.offerLetters.editor.identity.none", undefined, "— None —")}
                  </option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.city ? `· ${v.city}` : ""}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField
                name="employer"
                label={t("console.people.offerLetters.editor.identity.issuingEntity", undefined, "Issuing Entity")}
              >
                <NativeSelect name="employer" defaultValue={raw.employer}>
                  <option value="ghxstship">GHXSTSHIP Industries LLC</option>
                  <option value="five_senses">Five Senses Group</option>
                  <option value="joint">GHXSTSHIP × Five Senses</option>
                </NativeSelect>
              </FormField>
              <FormField
                name="classification"
                label={t("console.people.offerLetters.editor.identity.classification", undefined, "Classification")}
              >
                <NativeSelect name="classification" defaultValue={raw.classification}>
                  <option value="1099">
                    {t(
                      "console.people.offerLetters.editor.classification.1099",
                      undefined,
                      "1099 Independent Contractor",
                    )}
                  </option>
                  <option value="w2">
                    {t("console.people.offerLetters.editor.classification.w2", undefined, "W-2 Employee")}
                  </option>
                  <option value="agency">
                    {t("console.people.offerLetters.editor.classification.agency", undefined, "Agency Loan-Out")}
                  </option>
                  <option value="intern">
                    {t("console.people.offerLetters.editor.classification.intern", undefined, "Intern")}
                  </option>
                </NativeSelect>
              </FormField>
            </div>
          </fieldset>

          {/* ── COMPENSATION ─────────────────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
              {t("console.people.offerLetters.editor.compensation.legend", undefined, "Compensation")}
            </legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                name="rate_card_item_id"
                label={t("console.people.offerLetters.editor.compensation.rateCard", undefined, "Rate Card")}
              >
                <NativeSelect name="rate_card_item_id" defaultValue={raw.rate_card_item_id ?? ""}>
                  <option value="">
                    {t("console.people.offerLetters.editor.identity.none", undefined, "— None —")}
                  </option>
                  {rates.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.sku} · {r.name}{" "}
                      {r.unit_price_cents > 0
                        ? `· ${money(r.unit_price_cents)}`
                        : `· ${money(0)} ${t("console.people.offerLetters.editor.compensation.tbd", undefined, "(TBD)")}`}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField
                name="per_diem_rate_card_item_id"
                label={t(
                  "console.people.offerLetters.editor.compensation.perDiemRateCard",
                  undefined,
                  "Per Diem Rate Card",
                )}
              >
                <NativeSelect name="per_diem_rate_card_item_id" defaultValue={raw.per_diem_rate_card_item_id ?? ""}>
                  <option value="">
                    {t("console.people.offerLetters.editor.identity.none", undefined, "— None —")}
                  </option>
                  {rates.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.sku} · {r.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField
                name="compensation_basis"
                label={t("console.people.offerLetters.editor.compensation.basisLabel", undefined, "Compensation Basis")}
              >
                <NativeSelect name="compensation_basis" defaultValue={raw.compensation_basis}>
                  <option value="per_day">
                    {t(
                      "console.people.offerLetters.editor.compensation.basis.perDay",
                      undefined,
                      "Per Day — Rate × Engagement Days",
                    )}
                  </option>
                  <option value="per_show_day">
                    {t("console.people.offerLetters.editor.compensation.basis.perShowDay", undefined, "Per show day")}
                  </option>
                  <option value="flat_fee">
                    {t(
                      "console.people.offerLetters.editor.compensation.basis.flatFee",
                      undefined,
                      "Flat Project Fee — Uses Rate Card Unit Price",
                    )}
                  </option>
                  <option value="hourly">
                    {t("console.people.offerLetters.editor.compensation.basis.hourly", undefined, "Hourly")}
                  </option>
                  <option value="tbd">
                    {t("console.people.offerLetters.editor.compensation.basis.tbd", undefined, "To be confirmed")}
                  </option>
                </NativeSelect>
              </FormField>
              <FormField
                name="override_amount_dollars"
                label={t(
                  "console.people.offerLetters.editor.compensation.overrideTotal",
                  undefined,
                  "Override Total — USD",
                )}
                hint={t(
                  "console.people.offerLetters.editor.compensation.overrideTotalHint",
                  undefined,
                  "Leave blank to compute from rate × days",
                )}
              >
                <TextInput
                  name="override_amount_dollars"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={raw.override_amount_cents != null ? raw.override_amount_cents / 100 : ""}
                />
              </FormField>
              <FormField
                name="override_per_diem_dollars"
                label={t(
                  "console.people.offerLetters.editor.compensation.overridePerDiem",
                  undefined,
                  "Override Per Diem — USD/Day",
                )}
                hint={t(
                  "console.people.offerLetters.editor.compensation.overridePerDiemHint",
                  undefined,
                  "Leave blank to use the rate-card per diem",
                )}
              >
                <TextInput
                  name="override_per_diem_dollars"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={raw.override_per_diem_cents != null ? raw.override_per_diem_cents / 100 : ""}
                />
              </FormField>
              <div className="self-end rounded border border-[var(--border-default)] bg-[var(--p-surface-2)] px-3 py-2 text-xs">
                <div className="text-[var(--p-text-2)]">
                  {t("console.people.offerLetters.editor.compensation.effective", undefined, "Effective compensation")}
                </div>
                <div className="font-mono">
                  {resolved.effective_compensation_cents > 0
                    ? money(resolved.effective_compensation_cents)
                    : t("console.people.offerLetters.editor.compensation.tbdShort", undefined, "TBD")}
                </div>
                <div className="text-[var(--p-text-2)]">
                  {t(
                    "console.people.offerLetters.editor.compensation.days",
                    { count: resolved.engagement_days },
                    `${resolved.engagement_days} day(s)`,
                  )}
                </div>
              </div>
            </div>
          </fieldset>

          {/* ── ENGAGEMENT WINDOW (4 dates) ──────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
              {t(
                "console.people.offerLetters.editor.engagement.legend",
                undefined,
                "Engagement window (on-site dates drive compensation; travel dates are logistical only)",
              )}
            </legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                name="travel_in_date"
                label={t("console.people.offerLetters.editor.engagement.travelIn", undefined, "Travel In")}
                hint={t(
                  "console.people.offerLetters.editor.engagement.travelHint",
                  undefined,
                  "Leave blank if no travel",
                )}
              >
                <TextInput name="travel_in_date" type="date" defaultValue={raw.travel_in_date ?? ""} />
              </FormField>
              <FormField
                name="travel_out_date"
                label={t("console.people.offerLetters.editor.engagement.travelOut", undefined, "Travel Out")}
                hint={t(
                  "console.people.offerLetters.editor.engagement.travelHint",
                  undefined,
                  "Leave blank if no travel",
                )}
              >
                <TextInput name="travel_out_date" type="date" defaultValue={raw.travel_out_date ?? ""} />
              </FormField>
              <FormField
                name="onsite_start_date"
                label={t("console.people.offerLetters.editor.engagement.onsiteStart", undefined, "On Site Start")}
                hint={t(
                  "console.people.offerLetters.editor.engagement.onsiteHint",
                  { date: resolved.project_start_date ?? "—" },
                  `Project default: ${resolved.project_start_date ?? "—"} · drives day-rate × days math`,
                )}
              >
                <TextInput name="onsite_start_date" type="date" defaultValue={raw.onsite_start_date ?? ""} />
              </FormField>
              <FormField
                name="onsite_end_date"
                label={t("console.people.offerLetters.editor.engagement.onsiteEnd", undefined, "On Site End")}
                hint={t(
                  "console.people.offerLetters.editor.engagement.onsiteHint",
                  { date: resolved.project_end_date ?? "—" },
                  `Project default: ${resolved.project_end_date ?? "—"} · drives day-rate × days math`,
                )}
              >
                <TextInput name="onsite_end_date" type="date" defaultValue={raw.onsite_end_date ?? ""} />
              </FormField>
            </div>
          </fieldset>

          {/* ── INCLUSIONS / OVERRIDES ────────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
              {t(
                "console.people.offerLetters.editor.inclusions.legend",
                undefined,
                "Inclusions & per-letter overrides (NULL = inherit from org settings)",
              )}
            </legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <TriStateSelect
                name="travel_provided"
                label={t("console.people.offerLetters.editor.inclusions.travelProvided", undefined, "Travel Provided")}
                value={raw.travel_provided}
              />
              <TriStateSelect
                name="lodging_provided"
                label={t(
                  "console.people.offerLetters.editor.inclusions.lodgingProvided",
                  undefined,
                  "Lodging Provided",
                )}
                value={raw.lodging_provided}
              />
              <TriStateSelect
                name="meals_provided"
                label={t("console.people.offerLetters.editor.inclusions.mealsProvided", undefined, "Meals Provided")}
                value={raw.meals_provided}
              />
            </div>
            <FormField
              name="extra_inclusions"
              label={t("console.people.offerLetters.editor.inclusions.extra", undefined, "Extra Inclusions")}
              hint={t(
                "console.people.offerLetters.editor.inclusions.extraHint",
                undefined,
                "One per line — appended to org defaults",
              )}
            >
              <TextArea name="extra_inclusions" rows={3} defaultValue={(raw.extra_inclusions ?? []).join("\n")} />
            </FormField>
            <FormField
              name="expectations_override"
              label={t(
                "console.people.offerLetters.editor.inclusions.expectations",
                undefined,
                "Expectations Override",
              )}
              hint={t(
                "console.people.offerLetters.editor.inclusions.expectationsHint",
                undefined,
                "Leave blank to use the role's description + responsibilities",
              )}
            >
              <TextArea name="expectations_override" rows={4} defaultValue={raw.expectations_override ?? ""} />
            </FormField>
            <FormField
              name="terms_override"
              label={t("console.people.offerLetters.editor.inclusions.terms", undefined, "Terms Override")}
              hint={t(
                "console.people.offerLetters.editor.inclusions.termsHint",
                undefined,
                "Leave blank to use the org default terms",
              )}
            >
              <TextArea name="terms_override" rows={4} defaultValue={raw.terms_override ?? ""} />
            </FormField>
          </fieldset>
        </FormShell>
      </fieldset>
    </section>
  );
}

function TriStateSelect({ name, label, value }: { name: string; label: string; value: boolean | null }) {
  const t = useT();
  const v = value === null ? "" : value ? "true" : "false";
  return (
    <FormField name={name} label={label}>
      <NativeSelect name={name} defaultValue={v}>
        <option value="">
          {t("console.people.offerLetters.editor.triState.inherit", undefined, "Inherit — Org Default")}
        </option>
        <option value="true">{t("common.yes", undefined, "Yes")}</option>
        <option value="false">{t("common.no", undefined, "No")}</option>
      </NativeSelect>
    </FormField>
  );
}
