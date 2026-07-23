"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import {
  RESOURCE_KINDS,
  RESOURCE_KIND_LABELS,
  RESOURCE_STATES,
  RESOURCE_STATE_LABELS,
  formatTags,
  type Resource,
  type ResourceCollection,
} from "@/lib/legend_resources";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { State } from "./actions";

export function ResourceForm({
  action,
  collections,
  resource,
  submitLabel,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  collections: Pick<ResourceCollection, "id" | "name">[];
  resource?: Resource;
  submitLabel: string;
}) {
  const t = useT();
  return (
    <FormShell action={action} cancelHref="/legend/resources" submitLabel={submitLabel}>
      <Input
        label={t("console.legend.resources.form.title", undefined, "Title")}
        name="title"
        required
        maxLength={160}
        defaultValue={resource?.title ?? ""}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="collection_id" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.legend.resources.form.collection", undefined, "Collection")}
          </label>
          <select
            id="collection_id"
            name="collection_id"
            defaultValue={resource?.collection_id ?? ""}
            className="ps-input mt-1.5 w-full"
          >
            <option value="">{t("console.legend.resources.form.ungrouped", undefined, "Ungrouped")}</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="kind" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.legend.resources.form.kind", undefined, "Kind")}
          </label>
          <select
            id="kind"
            name="kind"
            defaultValue={resource?.kind ?? "link"}
            className="ps-input mt-1.5 w-full"
          >
            {RESOURCE_KINDS.map((k) => (
              <option key={k} value={k}>
                {RESOURCE_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        label={t("console.legend.resources.form.url", undefined, "URL")}
        name="url"
        type="url"
        placeholder="https://"
        defaultValue={resource?.url ?? ""}
        hint={t(
          "console.legend.resources.form.urlHint",
          undefined,
          "External link for the resource. Leave blank for stored references.",
        )}
      />
      <Input
        label={t("console.legend.resources.form.filePath", undefined, "File path")}
        name="file_path"
        maxLength={500}
        defaultValue={resource?.file_path ?? ""}
        hint={t(
          "console.legend.resources.form.filePathHint",
          undefined,
          "Text pointer to an already-stored object. File uploads are out of scope.",
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="resource_state" className="text-xs font-medium text-[var(--p-text-2)]">
            {t("console.legend.resources.form.state", undefined, "State")}
          </label>
          <select
            id="resource_state"
            name="resource_state"
            defaultValue={resource?.resource_state ?? "draft"}
            className="ps-input mt-1.5 w-full"
          >
            {RESOURCE_STATES.map((s) => (
              <option key={s} value={s}>
                {RESOURCE_STATE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <Input
          label={t("console.legend.resources.form.tags", undefined, "Tags")}
          name="tags"
          maxLength={500}
          defaultValue={formatTags(resource?.tags)}
          hint={t("console.legend.resources.form.tagsHint", undefined, "Comma-separated, e.g. onboarding, safety, brand.")}
        />
      </div>

      <div>
        <label htmlFor="description" className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.legend.resources.form.description", undefined, "Description")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="ps-input mt-1.5 w-full"
          defaultValue={resource?.description ?? ""}
        />
      </div>
    </FormShell>
  );
}
