import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateContractor, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ contractorId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { t } = await getRequestT();
  const row = await getOrgScoped("workforce_members", session.orgId, p.contractorId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateContractor.bind(null, p.contractorId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  const fallbackName = t("console.workforce.contractors.edit.fallbackName", undefined, "Contractor");
  const displayName = ((row as Record<string, unknown>)["full_name"] as string | undefined) ?? fallbackName;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.contractors.edit.eyebrow", undefined, "Contractor")}
        title={t("console.workforce.contractors.edit.title", { name: displayName }, `Edit ${displayName}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/workforce/contractors/${p.contractorId}`}
          submitLabel={t("console.workforce.contractors.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.workforce.contractors.edit.fullName", undefined, "Full Name")}
            name="full_name"
            defaultValue={row.full_name ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.workforce.contractors.edit.email", undefined, "Email")}
            name="email"
            type="email"
            defaultValue={row.email ?? ""}
          />
          <Input
            label={t("console.workforce.contractors.edit.phone", undefined, "Phone")}
            name="phone"
            defaultValue={row.phone ?? ""}
            maxLength={40}
          />
          <Input
            label={t("console.workforce.contractors.edit.role", undefined, "Role")}
            name="role"
            defaultValue={row.role ?? ""}
            maxLength={120}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.workforce.contractors.edit.kind", undefined, "Kind")}
            </span>
            <select name="kind" defaultValue={row.kind ?? ""} required className="input-base focus-ring w-full">
              <option value="paid_staff">paid_staff</option>
              <option value="volunteer">volunteer</option>
              <option value="contractor">contractor</option>
              <option value="official">official</option>
            </select>
          </label>
        </FormShell>
      </div>
    </>
  );
}
