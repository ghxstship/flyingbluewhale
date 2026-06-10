import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { quickFileIncident } from "./actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /m/incident/new — express incident intake. One field: tap, type a
 * sentence, submit. Designed for one-thumb filing while a crew member
 * is still on the floor. The full multi-field form (severity, body
 * part, photos, OSHA classification) lives at /m/incidents/new.
 *
 * Notification targeting (Blerter parity): the user can optionally select
 * which supervisors/managers to notify beyond the default org-admin fan-out.
 * This reduces alert fatigue while ensuring the right responders are reached.
 */

type Supervisor = { user_id: string; full_name: string | null; role: string };

export default async function QuickFilePage() {
  const { t } = await getRequestT();

  let supervisors: Supervisor[] = [];
  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();
    // Fetch org managers and admins the reporter can ping by name.
    // Capped at 20 to keep the list scannable on mobile.
    const { data } = await supabase
      .from("memberships")
      .select("user_id, role")
      .eq("org_id", session.orgId)
      .in("role", ["owner", "admin", "manager"])
      .neq("user_id", session.userId)
      .is("deleted_at", null)
      .limit(20);

    if (data && data.length > 0) {
      // Hydrate display names from user_profiles or fallback to user_id truncation.
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const nameMap = new Map((profiles ?? []).map((p) => [p.user_id, p.full_name as string | null]));
      supervisors = data.map((m) => ({
        user_id: m.user_id as string,
        full_name: nameMap.get(m.user_id as string) ?? null,
        role: m.role as string,
      }));
    }
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-danger)] uppercase">
        {t("m.incident.new.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.incident.new.title", undefined, "Quick File")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t(
          "m.incident.new.description",
          undefined,
          "Just describe what happened. We'll log it as a minor open incident — your supervisor will follow up to fill in severity, location, and photos. Need the full form?",
        )}{" "}
        <a className="underline" href="/m/incidents/new">
          {t("m.incident.new.openFullForm", undefined, "Open it")}
        </a>
        .
      </p>

      <form action={quickFileIncident} className="mt-5 space-y-3">
        <label className="block text-xs font-semibold">
          {t("m.incident.new.summaryLabel", undefined, "What happened?")}
          <textarea
            name="summary"
            required
            rows={5}
            minLength={5}
            maxLength={500}
            autoFocus
            placeholder={t(
              "m.incident.new.summaryPlaceholder",
              undefined,
              "e.g. Cable trip hazard near stage left exit — flagged with cone.",
            )}
            className="mt-1 w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-3 text-base"
          />
        </label>

        {supervisors.length > 0 && (
          <fieldset className="space-y-2 rounded-md border border-[var(--p-border)] p-3">
            <legend className="px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--p-text-2)]">
              {t("m.incident.new.notifyLabel", undefined, "Also notify (optional)")}
            </legend>
            <p className="text-[11px] text-[var(--p-text-2)]">
              {t(
                "m.incident.new.notifyHint",
                undefined,
                "Org admins are always notified. Select specific supervisors if this needs immediate attention from them.",
              )}
            </p>
            <div className="space-y-1.5">
              {supervisors.map((s) => (
                <label key={s.user_id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="notify_user_ids" value={s.user_id} className="h-4 w-4 rounded" />
                  <span>
                    {s.full_name ?? s.user_id.slice(0, 8)}
                    <span className="ml-1.5 text-[11px] text-[var(--p-text-2)] capitalize">· {s.role}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <button type="submit" className="ps-btn w-full">
          {t("m.incident.new.fileNow", undefined, "File Now")}
        </button>
      </form>
    </div>
  );
}
