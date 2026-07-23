"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import type { ResourceCollection } from "@/lib/legend_resources";
import { useT } from "@/lib/i18n/LocaleProvider";
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
  const t = useT();
  return (
    <FormShell action={action} cancelHref="/legend/resources/collections" submitLabel={submitLabel}>
      <Input
        label={t("console.legend.resources.collectionForm.name", undefined, "Name")}
        name="name"
        required
        maxLength={120}
        defaultValue={collection?.name ?? ""}
      />
      <Input
        label={t("console.legend.resources.collectionForm.sortOrder", undefined, "Sort order")}
        name="sort_order"
        type="number"
        min={0}
        defaultValue={String(collection?.sort_order ?? 0)}
        hint={t("console.legend.resources.collectionForm.sortHint", undefined, "Lower numbers sort first on the hub.")}
      />
      <div>
        <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.resources.collectionForm.description", undefined, "Description")}
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
