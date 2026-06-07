import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateClient, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("clients", session.orgId, p.clientId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateClient.bind(null, p.clientId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.clients.edit.eyebrow", undefined, "Client")}
        title={t("console.clients.edit.title", { name: row.name }, `Edit ${row.name}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/clients/${p.clientId}`}
          submitLabel={t("console.clients.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.clients.edit.fields.name", undefined, "Name")}
            name="name"
            defaultValue={row.name}
            required
            maxLength={200}
          />
          <Input
            label={t("console.clients.edit.fields.email", undefined, "Email")}
            name="contact_email"
            type="email"
            defaultValue={row.contact_email ?? ""}
          />
          <Input
            label={t("console.clients.edit.fields.phone", undefined, "Phone")}
            name="contact_phone"
            defaultValue={row.contact_phone ?? ""}
            maxLength={40}
          />
          <Input
            label={t("console.clients.edit.fields.website", undefined, "Website")}
            name="website"
            defaultValue={row.website ?? ""}
            maxLength={300}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.clients.edit.fields.notes", undefined, "Notes")}
            </span>
            <textarea
              name="notes"
              defaultValue={row.notes ?? ""}
              maxLength={4000}
              rows={5}
              className="ps-input focus-ring w-full"
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
