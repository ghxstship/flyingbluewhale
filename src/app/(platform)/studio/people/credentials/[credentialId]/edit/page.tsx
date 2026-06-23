import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateCredential, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ credentialId: string }> }) {
  const { t } = await getRequestT();
  const { credentialId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("credentials", session.orgId, credentialId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updateCredential.bind(null, credentialId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.credentials.edit.eyebrow", undefined, "People · Credential")}
        title={t("console.people.credentials.edit.title", undefined, "Edit Credential")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/people/credentials/${credentialId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.people.credentials.edit.kindLabel", undefined, "Kind")}
            name="kind"
            maxLength={80}
            defaultValue={(r.kind as string | undefined) ?? ""}
            required
          />
          <Input
            label={t("console.people.credentials.edit.numberLabel", undefined, "Number")}
            name="number"
            maxLength={120}
            defaultValue={(r.number as string | undefined) ?? ""}
          />
          <Input
            label={t("console.people.credentials.edit.issuedOnLabel", undefined, "Issued On")}
            name="issued_on"
            type="date"
            defaultValue={dateOnly(r.issued_on)}
          />
          <Input
            label={t("console.people.credentials.edit.expiresOnLabel", undefined, "Expires On")}
            name="expires_on"
            type="date"
            defaultValue={dateOnly(r.expires_on)}
          />
        </FormShell>
      </div>
    </>
  );
}

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}
