import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateMileage, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ mileageId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("mileage_logs", session.orgId, p.mileageId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateMileage.bind(null, p.mileageId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.mileage.edit.eyebrow", undefined, "Mileage Log")}
        title={t(
          "console.finance.mileage.edit.title",
          { origin: row.origin, destination: row.destination },
          `Edit ${row.origin} → ${row.destination}`,
        )}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/finance/mileage/${p.mileageId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.finance.mileage.edit.origin", undefined, "Origin")}
            name="origin"
            defaultValue={row.origin}
            required
            maxLength={200}
          />
          <Input
            label={t("console.finance.mileage.edit.destination", undefined, "Destination")}
            name="destination"
            defaultValue={row.destination}
            required
            maxLength={200}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.finance.mileage.edit.miles", undefined, "Miles")}
              name="miles"
              type="number"
              step="any"
              defaultValue={String(row.miles ?? 0)}
            />
            {/* Dollar-denominated entry; MoneyInput submits canonical
                integer cents via its hidden `rate_cents` field. */}
            <MoneyInput
              label={t("console.finance.mileage.edit.rate", undefined, "Rate — Per Mile")}
              name="rate_cents"
              defaultCents={row.rate_cents ?? 0}
            />
          </div>
          <Input
            label={t("console.finance.mileage.edit.loggedOn", undefined, "Logged On")}
            name="logged_on"
            type="date"
            defaultValue={dateOnly(row.logged_on)}
            required
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.finance.mileage.edit.notes", undefined, "Notes")}
            </span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              rows={4}
              maxLength={2000}
              className="ps-input focus-ring w-full"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
