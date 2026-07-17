import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateStaffMember, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ staffId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  // Deskless staff now live in crew_members (the person SSOT) — see ADR-0015
  // Addendum 2. getOrgScoped selects "*", so alias on the way out to keep the
  // form's field names unchanged.
  const dbRow = await getOrgScoped("crew_members", session.orgId, p.staffId);
  if (!dbRow) notFound();
  const { name, workforce_kind, ...restRow } = dbRow;
  const row = { ...restRow, full_name: name, kind: workforce_kind };
  const r = row as Record<string, unknown>;
  void r;
  const { t } = await getRequestT();
  const action = updateStaffMember.bind(null, p.staffId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const fullName = (row as Record<string, unknown>)["full_name"] as string | undefined;
  const fallbackName = t("console.workforce.staff.edit.fallbackName", undefined, "Staff member");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.staff.edit.eyebrow", undefined, "Staff Member")}
        title={t(
          "console.workforce.staff.edit.title",
          { name: fullName ?? fallbackName },
          `Edit ${fullName ?? fallbackName}`,
        )}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/workforce/staff/${p.staffId}`}
          submitLabel={t("console.workforce.staff.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.workforce.staff.edit.fullName", undefined, "Full Name")}
            name="full_name"
            defaultValue={row.full_name ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.workforce.staff.edit.email", undefined, "Email")}
            name="email"
            type="email"
            defaultValue={row.email ?? ""}
          />
          <Input
            label={t("console.workforce.staff.edit.phone", undefined, "Phone")}
            name="phone"
            defaultValue={row.phone ?? ""}
            maxLength={40}
          />
          <Input
            label={t("console.workforce.staff.edit.role", undefined, "Role")}
            name="role"
            defaultValue={row.role ?? ""}
            maxLength={120}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.workforce.staff.edit.kind", undefined, "Kind")}
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
