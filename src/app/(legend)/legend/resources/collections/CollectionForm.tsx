"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import type { ResourceCollection } from "@/lib/legend_resources";
import type { State } from "./actions";

export function CollectionForm({
  action,
  collection,
  submitLabel,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  collection?: ResourceCollection;
  submitLabel: string;
}) {
  return (
    <FormShell action={action} cancelHref="/legend/resources/collections" submitLabel={submitLabel}>
      <Input label="Name" name="name" required maxLength={120} defaultValue={collection?.name ?? ""} />
      <Input
        label="Sort order"
        name="sort_order"
        type="number"
        min={0}
        defaultValue={String(collection?.sort_order ?? 0)}
        hint="Lower numbers sort first on the hub."
      />
      <div>
        <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="ps-input mt-1.5 w-full"
          defaultValue={collection?.description ?? ""}
        />
      </div>
    </FormShell>
  );
}
