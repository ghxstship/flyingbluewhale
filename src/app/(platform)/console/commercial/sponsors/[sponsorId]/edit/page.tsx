import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  const action = updateSponsorEntitlement.bind(null, p.sponsorId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  const rowTitle = (row as Record<string, unknown>)["title"] as string | undefined;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.commercial.sponsors.edit.eyebrow", undefined, "Sponsor Entitlement")}
        title={
          rowTitle
            ? t("console.commercial.sponsors.edit.titleWithName", { name: rowTitle }, `Edit ${rowTitle}`)
            : t("console.commercial.sponsors.edit.titleFallback", undefined, "Edit Sponsor entitlement")
        }
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/commercial/sponsors/${p.sponsorId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.commercial.sponsors.edit.fields.title", undefined, "Title")}
            name="title"
            defaultValue={row.title ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.commercial.sponsors.edit.fields.quantity", undefined, "Quantity")}
            name="quantity"
            type="number"
            defaultValue={row.quantity != null ? String(row.quantity) : ""}
          />
          <Input
            label={t("console.commercial.sponsors.edit.fields.delivered", undefined, "Delivered")}
            name="delivered"
            type="number"
            defaultValue={row.delivered != null ? String(row.delivered) : ""}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.commercial.sponsors.edit.fields.status", undefined, "Status")}
            </span>
            <select name="status" defaultValue={row.status ?? ""} required className="ps-input focus-ring w-full">
              <option value="planned">planned</option>
              <option value="in_progress">in_progress</option>
              <option value="delivered">delivered</option>
              <option value="at_risk">at_risk</option>
              <option value="missed">missed</option>
            </select>
          </label>
          <Input
            label={t("console.commercial.sponsors.edit.fields.dueBy", undefined, "Due By")}
            name="due_by"
            type="date"
            defaultValue={dateOnly(row.due_by)}
          />
        </FormShell>
      </div>
    </>
  );
}
