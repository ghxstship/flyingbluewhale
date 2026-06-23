import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateAdManifest, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ manifestId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const { t } = await getRequestT();
  const session = await requireSession();
  const row = await getOrgScoped("ad_manifests", session.orgId, p.manifestId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateAdManifest.bind(null, p.manifestId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const flightRef =
    ((row as Record<string, unknown>)["flight_ref"] as string | undefined) ??
    t("console.transport.ad.edit.fallbackName", undefined, "A/D manifest");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.transport.ad.edit.eyebrow", undefined, "A/D manifest")}
        title={t("console.transport.ad.edit.title", { name: flightRef }, `Edit ${flightRef}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/transport/ad/${p.manifestId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.transport.ad.edit.kindLabel", undefined, "Kind")}
            </span>
            <select name="kind" defaultValue={row.kind ?? ""} required className="ps-input focus-ring w-full">
              <option value="arrival">arrival</option>
              <option value="departure">departure</option>
              <option value="transit">transit</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.transport.ad.edit.statusLabel", undefined, "Status")}
            </span>
            <select
              name="manifest_state"
              defaultValue={row.manifest_state ?? ""}
              required
              className="ps-input focus-ring w-full"
            >
              <option value="scheduled">scheduled</option>
              <option value="boarded">boarded</option>
              <option value="in_transit">in_transit</option>
              <option value="arrived">arrived</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <Input
            label={t("console.transport.ad.edit.flightRefLabel", undefined, "Flight Reference")}
            name="flight_ref"
            defaultValue={row.flight_ref ?? ""}
            maxLength={80}
          />
          <Input
            label={t("console.transport.ad.edit.carrierLabel", undefined, "Carrier")}
            name="carrier"
            defaultValue={row.carrier ?? ""}
            maxLength={120}
          />
          <Input
            label={t("console.transport.ad.edit.partySizeLabel", undefined, "Party Size")}
            name="party_size"
            type="number"
            defaultValue={row.party_size != null ? String(row.party_size) : ""}
          />
          <Input
            label={t("console.transport.ad.edit.scheduledAtLabel", undefined, "Scheduled At")}
            name="scheduled_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.scheduled_at)}
          />
          <Input
            label={t("console.transport.ad.edit.actualAtLabel", undefined, "Actual At")}
            name="actual_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.actual_at)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.transport.ad.edit.notesLabel", undefined, "Notes")}
            </span>
            <textarea name="notes" defaultValue={row.notes ?? ""} rows={5} className="ps-input focus-ring w-full" />
          </label>
        </FormShell>
      </div>
    </>
  );
}
