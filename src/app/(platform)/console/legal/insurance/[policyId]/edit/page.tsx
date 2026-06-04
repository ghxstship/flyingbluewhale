import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updatePolicy, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ policyId: string }> }) {
  const { policyId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("insurance_policies", session.orgId, policyId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updatePolicy.bind(null, policyId) as unknown as (state: State, fd: FormData) => Promise<State>;
  const { t } = await getRequestT();
  const policyNo =
    (r.policy_no as string | undefined) ?? t("console.legal.insurance.edit.policyFallback", undefined, "Policy");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.insurance.edit.eyebrow", undefined, "Legal · Insurance")}
        title={t("console.legal.insurance.edit.title", { policyNo }, `Edit ${policyNo}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/legal/insurance/${policyId}`}
          submitLabel={t("console.legal.insurance.edit.submit", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.legal.insurance.edit.carrierLabel", undefined, "Carrier")}
            name="carrier"
            maxLength={160}
            defaultValue={(r.carrier as string | undefined) ?? ""}
            required
          />
          <Input
            label={t("console.legal.insurance.edit.policyNoLabel", undefined, "Policy Number")}
            name="policy_no"
            maxLength={120}
            defaultValue={(r.policy_no as string | undefined) ?? ""}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {t("console.legal.insurance.edit.kindLabel", undefined, "Kind")}
            </label>
            <select
              name="kind"
              defaultValue={(r.kind as string | undefined) ?? "general_liability"}
              className="input-base mt-1.5 w-full"
              required
            >
              <option value="general_liability">
                {t("console.legal.insurance.edit.kind.generalLiability", undefined, "General Liability")}
              </option>
              <option value="motor">{t("console.legal.insurance.edit.kind.motor", undefined, "Motor")}</option>
              <option value="professional_indemnity">
                {t("console.legal.insurance.edit.kind.professionalIndemnity", undefined, "Professional Indemnity")}
              </option>
              <option value="event_cancellation">
                {t("console.legal.insurance.edit.kind.eventCancellation", undefined, "Event Cancellation")}
              </option>
              <option value="workers_compensation">
                {t("console.legal.insurance.edit.kind.workersCompensation", undefined, "Workers Compensation")}
              </option>
              <option value="property">{t("console.legal.insurance.edit.kind.property", undefined, "Property")}</option>
              <option value="other">{t("console.legal.insurance.edit.kind.other", undefined, "Other")}</option>
            </select>
          </div>
          <Input
            label={t("console.legal.insurance.edit.effectiveOnLabel", undefined, "Effective On")}
            name="effective_on"
            type="date"
            defaultValue={dateOnly(r.effective_on)}
          />
          <Input
            label={t("console.legal.insurance.edit.expiresOnLabel", undefined, "Expires On")}
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
