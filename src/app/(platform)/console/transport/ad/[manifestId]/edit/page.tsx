import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateAdManifest, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ manifestId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("ad_manifests", session.orgId, p.manifestId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateAdManifest.bind(null, p.manifestId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="A/D manifest"
        title={`Edit ${((row as Record<string, unknown>)["flight_ref"] as string | undefined) ?? "A/D manifest"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/transport/ad/${p.manifestId}`} submitLabel="Save changes">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Kind</span>
            <select name="kind" defaultValue={row.kind ?? ""} required className="input-base focus-ring w-full">
              <option value="arrival">arrival</option>
              <option value="departure">departure</option>
              <option value="transit">transit</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status ?? ""} required className="input-base focus-ring w-full">
              <option value="scheduled">scheduled</option>
              <option value="boarded">boarded</option>
              <option value="in_transit">in_transit</option>
              <option value="arrived">arrived</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <Input label="Flight reference" name="flight_ref" defaultValue={row.flight_ref ?? ""} maxLength={80} />
          <Input label="Carrier" name="carrier" defaultValue={row.carrier ?? ""} maxLength={120} />
          <Input
            label="Party size"
            name="party_size"
            type="number"
            defaultValue={row.party_size != null ? String(row.party_size) : ""}
          />
          <Input
            label="Scheduled at"
            name="scheduled_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.scheduled_at)}
          />
          <Input label="Actual at" name="actual_at" type="datetime-local" defaultValue={dateTimeLocal(row.actual_at)} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Notes</span>
            <textarea name="notes" defaultValue={row.notes ?? ""} rows={5} className="input-base focus-ring w-full" />
          </label>
        </FormShell>
      </div>
    </>
  );
}
