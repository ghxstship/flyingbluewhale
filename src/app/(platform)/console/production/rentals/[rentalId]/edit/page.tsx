import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateRental, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ rentalId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("rentals", session.orgId, p.rentalId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateRental.bind(null, p.rentalId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.rentals.edit.eyebrow", undefined, "Rental")}
        title={t("console.production.rentals.edit.title", undefined, "Edit Rental")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/production/rentals/${p.rentalId}`}
          submitLabel={t("console.production.rentals.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.production.rentals.edit.startsAt", undefined, "Starts At")}
            name="starts_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.starts_at)}
            required
          />
          <Input
            label={t("console.production.rentals.edit.endsAt", undefined, "Ends At")}
            name="ends_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.ends_at)}
            required
          />
          <Input
            label={t("console.production.rentals.edit.rateCents", undefined, "Rate — Cents")}
            name="rate_cents"
            type="number"
            defaultValue={row.rate_cents != null ? String(row.rate_cents) : ""}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.production.rentals.edit.notes", undefined, "Notes")}
            </span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              rows={4}
              maxLength={4000}
              className="input-base focus-ring w-full"
            />
          </label>
          <p className="text-xs text-[var(--text-muted)]">
            {t(
              "console.production.rentals.edit.changeHint",
              undefined,
              "To change equipment or project, delete and recreate.",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
