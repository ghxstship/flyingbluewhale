import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateTrademark, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ markId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("trademarks", session.orgId, p.markId);
  if (!row) notFound();
  const { t } = await getRequestT();
  const action = updateTrademark.bind(null, p.markId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.ip.edit.eyebrow", undefined, "Trademark")}
        title={t("console.legal.ip.edit.title", { mark: row.mark }, `Edit ${row.mark}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/legal/ip/${p.markId}`}
          submitLabel={t("console.legal.ip.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.legal.ip.edit.mark", undefined, "Mark")}
            name="mark"
            defaultValue={row.mark}
            required
            maxLength={200}
          />
          <Input
            label={t("console.legal.ip.edit.jurisdiction", undefined, "Jurisdiction")}
            name="jurisdiction"
            defaultValue={row.jurisdiction ?? ""}
            maxLength={120}
          />
          <Input
            label={t("console.legal.ip.edit.registrationNo", undefined, "Registration #")}
            name="registration_no"
            defaultValue={row.registration_no ?? ""}
            maxLength={120}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.legal.ip.edit.trademark_state", undefined, "Status")}
            </span>
            <select name="trademark_state" defaultValue={row.trademark_state} className="ps-input focus-ring w-full">
              <option value="pending">{t("console.legal.ip.edit.statusPending", undefined, "pending")}</option>
              <option value="registered">{t("console.legal.ip.edit.statusRegistered", undefined, "registered")}</option>
              <option value="abandoned">{t("console.legal.ip.edit.statusAbandoned", undefined, "abandoned")}</option>
              <option value="expired">{t("console.legal.ip.edit.statusExpired", undefined, "expired")}</option>
            </select>
          </label>
          <Input
            label={t("console.legal.ip.edit.registeredOn", undefined, "Registered On")}
            name="registered_on"
            type="date"
            defaultValue={dateOnly(row.registered_on)}
          />
          <Input
            label={t("console.legal.ip.edit.expiresOn", undefined, "Expires On")}
            name="expires_on"
            type="date"
            defaultValue={dateOnly(row.expires_on)}
          />
        </FormShell>
      </div>
    </>
  );
}
