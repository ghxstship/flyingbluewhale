"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import {
  SIGNAGE_STANDARDS,
  SIGNAGE_STANDARD_LABELS,
  SIGNAGE_CATEGORIES,
  SIGNAGE_CATEGORY_LABELS,
  SIGN_STATES,
  SIGN_STATE_LABELS,
  type SignageSign,
} from "@/lib/legend_signage";
import { PICTOGRAMS } from "@/lib/signage_pictograms";
import { createSignAction, type State } from "../actions";

export function NewSignForm({
  action = createSignAction,
  sign,
  submitLabel = "Create Sign",
}: {
  action?: (prev: State, fd: FormData) => Promise<State>;
  sign?: SignageSign;
  submitLabel?: string;
} = {}) {
  return (
    <FormShell action={action} cancelHref="/console/legend/signage" submitLabel={submitLabel}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Code"
          name="code"
          required
          maxLength={60}
          placeholder="ISO-E001"
          defaultValue={sign?.code ?? ""}
        />
        <Input
          label="Name"
          name="name"
          required
          maxLength={160}
          placeholder="Emergency exit"
          defaultValue={sign?.name ?? ""}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-[var(--p-text-2)]">Standard</span>
          <select
            name="standard"
            defaultValue={sign?.standard ?? "iso7010"}
            className="ps-input mt-1.5 w-full"
          >
            {SIGNAGE_STANDARDS.map((s) => (
              <option key={s} value={s}>
                {SIGNAGE_STANDARD_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-[var(--p-text-2)]">Category</span>
          <select
            name="category"
            defaultValue={sign?.category ?? "safe_condition"}
            className="ps-input mt-1.5 w-full"
          >
            {SIGNAGE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SIGNAGE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Pictogram key"
          name="pictogram_key"
          required
          maxLength={120}
          list="pictogram-ids"
          placeholder="aiga-exit"
          defaultValue={sign?.pictogram_key ?? ""}
        />
        <datalist id="pictogram-ids">
          {PICTOGRAMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} · {p.group}
            </option>
          ))}
        </datalist>
        <Input
          label="Colorway"
          name="colorway"
          maxLength={80}
          placeholder="life-safety green"
          defaultValue={sign?.colorway ?? ""}
        />
      </div>
      <label className="block">
        <span className="text-xs font-medium text-[var(--p-text-2)]">State</span>
        <select
          name="sign_state"
          defaultValue={sign?.sign_state ?? "draft"}
          className="ps-input mt-1.5 w-full"
        >
          {SIGN_STATES.map((s) => (
            <option key={s} value={s}>
              {SIGN_STATE_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-medium text-[var(--p-text-2)]">Notes</span>
        <textarea
          name="notes"
          rows={3}
          className="ps-input mt-1.5 w-full"
          defaultValue={sign?.notes ?? ""}
        />
      </label>
    </FormShell>
  );
}
