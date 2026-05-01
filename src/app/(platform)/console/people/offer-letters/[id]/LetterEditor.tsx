"use client";

import { FormShell, type FormState } from "@/components/FormShell";
import { FormField, TextInput, TextArea, NativeSelect } from "@/components/forms/FormField";
import type { OfferLetter } from "@/lib/offer-letters/types";
import { saveLetter } from "./actions";

export function LetterEditor({ letter }: { letter: OfferLetter }) {
  const action = async (prev: FormState, fd: FormData) => {
    const r = await saveLetter(letter.id, prev as never, fd);
    return r as FormState;
  };

  const compensationDollars = letter.compensation_cents / 100;
  const perDiemDollars = letter.per_diem_cents / 100;
  const inclusionsValue = (letter.inclusions ?? []).join("\n");
  const isLocked = ["accepted", "declined", "withdrawn"].includes(letter.status);

  return (
    <section className="surface-raised space-y-1 p-1">
      <div className="px-5 pt-5">
        <h3 className="text-sm font-semibold tracking-wider uppercase">Edit Letter</h3>
        {isLocked && (
          <p className="mt-1 text-xs text-[var(--color-warning)]">
            This letter is locked ({letter.status}). Edits are disabled.
          </p>
        )}
      </div>
      <fieldset disabled={isLocked} className="space-y-0">
        <FormShell action={action} submitLabel="Save changes" className="space-y-6 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField name="recipient_name" label="Recipient name" required>
              <TextInput name="recipient_name" defaultValue={letter.recipient_name} />
            </FormField>
            <FormField name="recipient_email" label="Recipient email" required>
              <TextInput name="recipient_email" type="email" defaultValue={letter.recipient_email} />
            </FormField>
            <FormField name="recipient_phone" label="Phone">
              <TextInput name="recipient_phone" defaultValue={letter.recipient_phone ?? ""} />
            </FormField>
            <FormField name="role_title" label="Role / title" required>
              <TextInput name="role_title" defaultValue={letter.role_title} />
            </FormField>
            <FormField name="department" label="Department">
              <TextInput name="department" defaultValue={letter.department ?? ""} />
            </FormField>
            <FormField name="employer" label="Issuing entity">
              <NativeSelect name="employer" defaultValue={letter.employer}>
                <option value="ghxstship">GHXSTSHIP Industries LLC</option>
                <option value="five_senses">Five Senses Group</option>
                <option value="joint">GHXSTSHIP × Five Senses</option>
              </NativeSelect>
            </FormField>
            <FormField name="classification" label="Classification">
              <NativeSelect name="classification" defaultValue={letter.classification}>
                <option value="1099">1099 Independent Contractor</option>
                <option value="w2">W-2 Employee</option>
                <option value="agency">Agency Loan-Out</option>
                <option value="intern">Intern</option>
              </NativeSelect>
            </FormField>
            <FormField name="reports_to_name" label="Reports to">
              <TextInput name="reports_to_name" defaultValue={letter.reports_to_name ?? ""} />
            </FormField>
            <FormField name="reports_to_email" label="Reports-to email">
              <TextInput name="reports_to_email" type="email" defaultValue={letter.reports_to_email ?? ""} />
            </FormField>
            <FormField name="work_location" label="Work location">
              <TextInput name="work_location" defaultValue={letter.work_location ?? ""} />
            </FormField>
            <FormField name="engagement_start" label="Engagement start">
              <TextInput name="engagement_start" type="date" defaultValue={letter.engagement_start ?? ""} />
            </FormField>
            <FormField name="engagement_end" label="Engagement end">
              <TextInput name="engagement_end" type="date" defaultValue={letter.engagement_end ?? ""} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField name="compensation_basis" label="Compensation basis">
              <NativeSelect name="compensation_basis" defaultValue={letter.compensation_basis}>
                <option value="flat_fee">Flat project fee</option>
                <option value="per_day">Per day</option>
                <option value="hourly">Hourly</option>
                <option value="tbd">To be confirmed</option>
              </NativeSelect>
            </FormField>
            <FormField name="compensation_dollars" label="Compensation (USD)">
              <TextInput
                name="compensation_dollars"
                type="number"
                min="0"
                step="1"
                defaultValue={compensationDollars}
              />
            </FormField>
            <FormField name="per_diem_dollars" label="Per diem (USD/day)">
              <TextInput name="per_diem_dollars" type="number" min="0" step="1" defaultValue={perDiemDollars} />
            </FormField>
            <FormField name="compensation_label" label="Compensation label (override)">
              <TextInput
                name="compensation_label"
                defaultValue={letter.compensation_label ?? ""}
                placeholder="e.g. USD 1,500 per show day"
              />
            </FormField>
            <FormField
              name="payment_schedule"
              label="Payment schedule"
              hint="Default: 60 % deposit on signature, 40 % on load-in"
            >
              <TextInput name="payment_schedule" defaultValue={letter.payment_schedule ?? ""} />
            </FormField>
            <FormField name="governing_law" label="Governing law">
              <TextInput name="governing_law" defaultValue={letter.governing_law} />
            </FormField>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="travel_provided" defaultChecked={letter.travel_provided} />
              Travel provided
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="lodging_provided" defaultChecked={letter.lodging_provided} />
              Lodging provided
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="meals_provided" defaultChecked={letter.meals_provided} />
              Meals provided
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="confidentiality" defaultChecked={letter.confidentiality} />
              Confidentiality clause
            </label>
          </div>

          <FormField name="inclusions" label="Inclusions" hint="One per line">
            <TextArea name="inclusions" rows={4} defaultValue={inclusionsValue} />
          </FormField>

          <FormField name="expectations" label="Expectations / scope">
            <TextArea name="expectations" rows={4} defaultValue={letter.expectations ?? ""} />
          </FormField>

          <FormField name="terms" label="Additional terms">
            <TextArea name="terms" rows={4} defaultValue={letter.terms ?? ""} />
          </FormField>
        </FormShell>
      </fieldset>
    </section>
  );
}
