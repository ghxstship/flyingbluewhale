import { FormShell } from "@/components/FormShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createTimeOffRequest } from "../actions";

export const dynamic = "force-dynamic";

type Policy = { id: string; name: string; policy_kind: string };

export default async function NewTimeOffPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();
  const { data: policies } = await supabase
    .from("time_off_policies")
    .select("id, name, policy_kind")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  const list = (policies ?? []) as Policy[];

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-semibold">{t("m.timeOff.new.title", undefined, "New Time-Off Request")}</h1>
      {list.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            size="compact"
            title={t("m.timeOff.new.empty.title", undefined, "No Time-Off Policies")}
            description={t(
              "m.timeOff.new.empty.description",
              undefined,
              "An admin needs to set up time-off policies before you can request time off.",
            )}
          />
        </div>
      ) : (
        <FormShell
          action={createTimeOffRequest}
          className="mt-5 space-y-4"
          submitLabel={t("common.submit", undefined, "Submit")}
          cancelHref="/m/time-off"
        >
          <label className="block text-xs font-semibold">
            {t("m.timeOff.new.policy", undefined, "Policy")}
            <select
              name="policy_id"
              required
              className="mt-1 w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-sm"
            >
              {list.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold">
            {t("m.timeOff.new.startsOn", undefined, "Starts on")}
            <input
              type="date"
              name="starts_on"
              required
              className="mt-1 w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            {t("m.timeOff.new.endsOn", undefined, "Ends on")}
            <input
              type="date"
              name="ends_on"
              required
              className="mt-1 w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            {t("m.timeOff.new.hoursRequested", undefined, "Hours requested")}
            <input
              type="number"
              name="hours_requested"
              min="1"
              step="0.5"
              required
              className="mt-1 w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-semibold">
            {t("m.timeOff.new.reason", undefined, "Reason")}
            <textarea
              name="reason"
              rows={3}
              maxLength={1000}
              className="mt-1 w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-sm"
            />
          </label>
        </FormShell>
      )}
    </div>
  );
}
