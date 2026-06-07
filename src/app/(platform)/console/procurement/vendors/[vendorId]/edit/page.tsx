import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateVendor, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("vendors", session.orgId, p.vendorId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateVendor.bind(null, p.vendorId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.vendors.edit.eyebrow", undefined, "Vendor")}
        title={t("console.procurement.vendors.edit.title", { name: row.name }, `Edit ${row.name}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/procurement/vendors/${p.vendorId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.procurement.vendors.edit.nameLabel", undefined, "Name")}
            name="name"
            defaultValue={row.name}
            required
            maxLength={200}
          />
          <Input
            label={t("console.procurement.vendors.edit.categoryLabel", undefined, "Category")}
            name="category"
            defaultValue={row.category ?? ""}
            maxLength={120}
          />
          <Input
            label={t("console.procurement.vendors.edit.contactEmailLabel", undefined, "Contact Email")}
            name="contact_email"
            type="email"
            defaultValue={row.contact_email ?? ""}
          />
          <Input
            label={t("console.procurement.vendors.edit.contactPhoneLabel", undefined, "Contact Phone")}
            name="contact_phone"
            defaultValue={row.contact_phone ?? ""}
            maxLength={40}
          />
          <Input
            label={t("console.procurement.vendors.edit.coiExpiresLabel", undefined, "COI expires on")}
            name="coi_expires_at"
            type="date"
            defaultValue={dateOnly(row.coi_expires_at)}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.procurement.vendors.edit.notesLabel", undefined, "Notes")}
            </span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              rows={4}
              maxLength={4000}
              className="ps-input focus-ring w-full"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
