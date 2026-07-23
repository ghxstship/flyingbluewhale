"use client";

import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { RecordCombobox } from "@/components/RecordCombobox";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { State } from "./actions";

/**
 * Assign a person (a `parties` row — the canonical person layer) to a
 * position seat. The party picker is the async RecordCombobox precedent:
 * server-side type-ahead over org parties, so rosters past any list cap
 * stay findable.
 */
export function AssignHolderForm({
  action,
  positionId,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  positionId: string;
}) {
  const t = useT();
  return (
    <FormShell
      action={action}
      cancelHref={`/legend/hub/organization/${positionId}`}
      submitLabel={t("console.legend.hub.organization.holders.assignSubmit", undefined, "Assign")}
      dirtyGuard={false}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
        <RecordCombobox
          table="parties"
          name="party_id"
          label={t("console.legend.hub.organization.holders.person", undefined, "Person")}
          placeholder={t("console.legend.hub.organization.holders.personPlaceholder", undefined, "Pick a person…")}
          searchPlaceholder={t(
            "console.legend.hub.organization.holders.personSearch",
            undefined,
            "Search people…",
          )}
          emptyLabel={t("console.legend.hub.organization.holders.personEmpty", undefined, "No matching people")}
        />
        <Input
          label={t("console.legend.hub.organization.holders.startsOn", undefined, "Starts on")}
          name="starts_on"
          type="date"
        />
      </div>
    </FormShell>
  );
}
