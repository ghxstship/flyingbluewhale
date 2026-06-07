import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateVolunteer, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ volunteerId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const { t } = await getRequestT();
  const row = await getOrgScoped("workforce_members", session.orgId, p.volunteerId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateVolunteer.bind(null, p.volunteerId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const fallbackName = t("console.workforce.volunteers.edit.fallbackName", undefined, "Volunteer");
  const displayName = ((row as Record<string, unknown>)["full_name"] as string | undefined) ?? fallbackName;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.volunteers.edit.eyebrow", undefined, "Volunteer")}
        title={t("console.workforce.volunteers.edit.title", { name: displayName }, `Edit ${displayName}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/workforce/volunteers/${p.volunteerId}`}
          submitLabel={t("console.workforce.volunteers.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.workforce.volunteers.edit.fullName", undefined, "Full Name")}
            name="full_name"
            defaultValue={row.full_name ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.workforce.volunteers.edit.email", undefined, "Email")}
            name="email"
            type="email"
            defaultValue={row.email ?? ""}
          />
          <Input
            label={t("console.workforce.volunteers.edit.phone", undefined, "Phone")}
            name="phone"
            defaultValue={row.phone ?? ""}
            maxLength={40}
          />
          <Input
            label={t("console.workforce.volunteers.edit.role", undefined, "Role")}
            name="role"
            defaultValue={row.role ?? ""}
            maxLength={120}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.workforce.volunteers.edit.kind", undefined, "Kind")}
            </span>
            <select name="kind" defaultValue={row.kind ?? ""} required className="ps-input focus-ring w-full">
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
