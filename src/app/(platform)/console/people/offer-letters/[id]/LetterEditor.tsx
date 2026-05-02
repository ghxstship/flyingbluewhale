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

  const isLocked = raw.status !== "draft";

  return (
    <section className="surface space-y-1 p-1">
      <div className="px-5 pt-5">
        <h3 className="text-sm font-semibold tracking-wider uppercase">Edit Letter</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          All fields reference canonical SSOT records. Empty boolean / override = inherit from org defaults or rate
          card.
        </p>
        {isLocked && (
          <p className="mt-1 text-xs text-[var(--color-warning)]">
            This letter is {raw.status}. Edits are disabled — the snapshot is frozen.
          </p>
        )}
      </div>
      <fieldset disabled={isLocked} className="space-y-0">
        <FormShell action={action} submitLabel="Save Changes" className="space-y-6 p-5">
          {/* ── IDENTITY ─────────────────────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
              Identity & Position (FK → crew_members, org_roles)
            </legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField name="crew_member_id" label="Recipient (crew_members)" required>
                <NativeSelect name="crew_member_id" defaultValue={raw.crew_member_id}>
                  {crew.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email ? `· ${c.email}` : ""}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField name="role_id" label="Role (org_roles)" required>
                <NativeSelect name="role_id" defaultValue={raw.role_id}>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} {r.department ? `· ${r.department}` : ""}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField name="reports_to_crew_member_id" label="Reports To (crew_members)">
                <NativeSelect name="reports_to_crew_member_id" defaultValue={raw.reports_to_crew_member_id ?? ""}>
                  <option value="">— None —</option>
                  {crew.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField name="venue_id" label="Venue (venues)">
                <NativeSelect name="venue_id" defaultValue={raw.venue_id ?? ""}>
                  <option value="">— None —</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.city ? `· ${v.city}` : ""}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField name="employer" label="Issuing Entity">
                <NativeSelect name="employer" defaultValue={raw.employer}>
                  <option value="ghxstship">GHXSTSHIP Industries LLC</option>
                  <option value="five_senses">Five Senses Group</option>
                  <option value="joint">GHXSTSHIP × Five Senses</option>
                </NativeSelect>
              </FormField>
              <FormField name="classification" label="Classification">
                <NativeSelect name="classification" defaultValue={raw.classification}>
                  <option value="1099">1099 Independent Contractor</option>
                  <option value="w2">W-2 Employee</option>
                  <option value="agency">Agency Loan-Out</option>
                  <option value="intern">Intern</option>
                </NativeSelect>
              </FormField>
            </div>
          </fieldset>

          {/* ── COMPENSATION ─────────────────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
              Compensation (FK → rate_card_items)
            </legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField name="rate_card_item_id" label="Rate Card (rate_card_items)">
                <NativeSelect name="rate_card_item_id" defaultValue={raw.rate_card_item_id ?? ""}>
                  <option value="">— None —</option>
                  {rates.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.sku} · {r.name}{" "}
                      {r.unit_price_cents > 0 ? `· $${(r.unit_price_cents / 100).toLocaleString()}` : "· $0 (TBD)"}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField name="per_diem_rate_card_item_id" label="Per Diem Rate Card (rate_card_items)">
                <NativeSelect name="per_diem_rate_card_item_id" defaultValue={raw.per_diem_rate_card_item_id ?? ""}>
                  <option value="">— None —</option>
                  {rates.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.sku} · {r.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField name="compensation_basis" label="Compensation Basis">
                <NativeSelect name="compensation_basis" defaultValue={raw.compensation_basis}>
                  <option value="per_day">Per day (rate × engagement days)</option>
                  <option value="per_show_day">Per show day</option>
                  <option value="flat_fee">Flat project fee (uses rate card unit price)</option>
                  <option value="hourly">Hourly</option>
                  <option value="tbd">To be confirmed</option>
                </NativeSelect>
              </FormField>
              <FormField
                name="override_amount_dollars"
                label="Override Total (USD)"
                hint="Leave blank to compute from rate × days"
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
                label="Override Per Diem (USD/Day)"
                hint="Leave blank to use the rate-card per diem"
              >
                <TextInput
                  name="override_per_diem_dollars"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={raw.override_per_diem_cents != null ? raw.override_per_diem_cents / 100 : ""}
                />
              </FormField>
              <div className="self-end rounded border border-[var(--border-default)] bg-[var(--surface-inset)] px-3 py-2 text-xs">
                <div className="text-[var(--text-muted)]">Effective compensation</div>
                <div className="font-mono">
                  {resolved.effective_compensation_cents > 0
                    ? `$${(resolved.effective_compensation_cents / 100).toLocaleString()}`
                    : "TBD"}
                </div>
                <div className="text-[var(--text-muted)]">{resolved.engagement_days} day(s)</div>
              </div>
            </div>
          </fieldset>

          {/* ── ENGAGEMENT WINDOW ────────────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
              Engagement window (NULL = inherit from project)
            </legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                name="engagement_start"
                label="Engagement Start"
                hint={`Project default: ${resolved.project_start_date ?? "—"}`}
              >
                <TextInput name="engagement_start" type="date" defaultValue={raw.engagement_start ?? ""} />
              </FormField>
              <FormField
                name="engagement_end"
                label="Engagement End"
                hint={`Project default: ${resolved.project_end_date ?? "—"}`}
              >
                <TextInput name="engagement_end" type="date" defaultValue={raw.engagement_end ?? ""} />
              </FormField>
            </div>
          </fieldset>

          {/* ── INCLUSIONS / OVERRIDES ────────────────────────────────────── */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
              Inclusions &amp; per-letter overrides (NULL = inherit from org settings)
            </legend>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <TriStateSelect name="travel_provided" label="Travel Provided" value={raw.travel_provided} />
              <TriStateSelect name="lodging_provided" label="Lodging Provided" value={raw.lodging_provided} />
              <TriStateSelect name="meals_provided" label="Meals Provided" value={raw.meals_provided} />
            </div>
            <FormField name="extra_inclusions" label="Extra Inclusions" hint="One per line — appended to org defaults">
              <TextArea name="extra_inclusions" rows={3} defaultValue={(raw.extra_inclusions ?? []).join("\n")} />
            </FormField>
            <FormField
              name="expectations_override"
              label="Expectations Override"
              hint="Leave blank to use the role's description + responsibilities"
            >
              <TextArea name="expectations_override" rows={4} defaultValue={raw.expectations_override ?? ""} />
            </FormField>
            <FormField name="terms_override" label="Terms Override" hint="Leave blank to use the org default terms">
              <TextArea name="terms_override" rows={4} defaultValue={raw.terms_override ?? ""} />
            </FormField>
          </fieldset>
        </FormShell>
      </fieldset>
    </section>
  );
}

function TriStateSelect({ name, label, value }: { name: string; label: string; value: boolean | null }) {
  const v = value === null ? "" : value ? "true" : "false";
  return (
    <FormField name={name} label={label}>
      <NativeSelect name={name} defaultValue={v}>
        <option value="">Inherit (org default)</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </NativeSelect>
    </FormField>
  );
}
