import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateDelegation, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ delegationId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("delegations", session.orgId, p.delegationId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const { t } = await getRequestT();
  const action = updateDelegation.bind(null, p.delegationId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  const delegationName =
    ((row as Record<string, unknown>)["name"] as string | undefined) ??
    t("console.participants.delegations.edit.fallbackName", undefined, "Delegation");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.participants.delegations.edit.eyebrow", undefined, "Delegation")}
        title={t("console.participants.delegations.edit.title", { name: delegationName }, `Edit ${delegationName}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/participants/delegations/${p.delegationId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.participants.delegations.edit.fields.name", undefined, "Name")}
            name="name"
            defaultValue={row.name ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.participants.delegations.edit.fields.code", undefined, "Code")}
            name="code"
            defaultValue={row.code ?? ""}
            required
            maxLength={40}
          />
          <Input
            label={t("console.participants.delegations.edit.fields.country", undefined, "Country")}
            name="country"
            defaultValue={row.country ?? ""}
            maxLength={120}
          />
          <Input
            label={t("console.participants.delegations.edit.fields.contactEmail", undefined, "Contact Email")}
            name="contact_email"
            type="email"
            defaultValue={row.contact_email ?? ""}
          />
          <Input
            label={t("console.participants.delegations.edit.fields.contactPhone", undefined, "Contact Phone")}
            name="contact_phone"
            defaultValue={row.contact_phone ?? ""}
            maxLength={40}
          />
        </FormShell>
      </div>
    </>
  );
}
