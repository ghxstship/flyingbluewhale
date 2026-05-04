import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateSponsorEntitlement, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ sponsorId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("sponsor_entitlements", session.orgId, p.sponsorId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateSponsorEntitlement.bind(null, p.sponsorId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Sponsor Entitlement"
        title={`Edit ${((row as Record<string, unknown>)["title"] as string | undefined) ?? "Sponsor entitlement"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/commercial/sponsors/${p.sponsorId}`}
          submitLabel="Save Changes"
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input label="Title" name="title" defaultValue={row.title ?? ""} required maxLength={200} />
          <Input
            label="Quantity"
            name="quantity"
            type="number"
            defaultValue={row.quantity != null ? String(row.quantity) : ""}
          />
          <Input
            label="Delivered"
            name="delivered"
            type="number"
            defaultValue={row.delivered != null ? String(row.delivered) : ""}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status ?? ""} required className="input-base focus-ring w-full">
              <option value="planned">planned</option>
              <option value="in_progress">in_progress</option>
              <option value="delivered">delivered</option>
              <option value="at_risk">at_risk</option>
              <option value="missed">missed</option>
            </select>
          </label>
          <Input label="Due By" name="due_by" type="date" defaultValue={dateOnly(row.due_by)} />
        </FormShell>
      </div>
    </>
  );
}
