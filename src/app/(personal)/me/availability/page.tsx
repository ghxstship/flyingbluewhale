import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { getRequestT } from "@/lib/i18n/request";
import { addAvailabilityAction, deleteAvailabilityAction } from "./actions";

export const dynamic = "force-dynamic";

type Slot = {
  id: string;
  kind: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  label: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div>{t("me.availability.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_slots")
    .select("id, kind, starts_at, ends_at, all_day, label")
    .eq("user_id", session.userId)
    .order("starts_at", { ascending: true })
    .limit(200);
  const slots = (data ?? []) as Slot[];

  return (
    <div className="space-y-6">
      <header>
        <div className="text-label text-[var(--color-text-tertiary)]">
          {t("me.availability.eyebrow", undefined, "Availability")}
        </div>
        <h1 className="text-display mt-1 text-3xl">{t("me.availability.title", undefined, "Booking Calendar")}</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {t(
            "me.availability.subtitle",
            undefined,
            "Holds, confirms, and blocks. Booking surfaces (gigs, talent offers) read from here when checking your fit.",
          )}
        </p>
      </header>

      <section className="card-elevated p-4">
        <h2 className="text-label mb-3 text-[var(--color-text-tertiary)]">
          {t("me.availability.addSlot", undefined, "Add slot")}
        </h2>
        <FormShell action={addAvailabilityAction} submitLabel={t("common.add", undefined, "Add")}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">{t("me.availability.kind", undefined, "Kind")}</label>
              <select name="kind" className="ps-input mt-1.5 w-full" defaultValue="hold">
                <option value="hold">{t("me.availability.kind.hold", undefined, "Hold — Auto-release on TTL")}</option>
                <option value="confirm">{t("me.availability.kind.confirm", undefined, "Confirm — Locked")}</option>
                <option value="block">{t("me.availability.kind.block", undefined, "Block — Unavailable")}</option>
              </select>
            </div>
            <Input
              label={t("me.availability.label", undefined, "Label")}
              name="label"
              placeholder={t("me.availability.labelPlaceholder", undefined, "MMW26 deck build")}
            />
            <Input
              label={t("me.availability.starts", undefined, "Starts")}
              name="starts_at"
              type="datetime-local"
              required
            />
            <Input label={t("me.availability.ends", undefined, "Ends")} name="ends_at" type="datetime-local" required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="all_day" /> {t("me.availability.allDay", undefined, "All-day")}
          </label>
        </FormShell>
      </section>

      <section>
        <h2 className="text-label mb-3 text-[var(--color-text-tertiary)]">
          {t("me.availability.upcoming", undefined, "Upcoming")}
        </h2>
        {slots.length === 0 ? (
          <div className="card-elevated p-6 text-sm text-[var(--color-text-secondary)]">
            {t("me.availability.empty", undefined, "No availability slots yet.")}
          </div>
        ) : (
          <ul className="space-y-2">
            {slots.map((s) => (
              <li key={s.id} className="card-elevated flex items-center justify-between p-3 text-sm">
                <div>
                  <Badge variant={s.kind === "confirm" ? "success" : s.kind === "block" ? "error" : "warning"}>
                    {s.kind}
                  </Badge>
                  <span className="ms-3 font-mono text-xs">
                    {new Date(s.starts_at).toLocaleString()} → {new Date(s.ends_at).toLocaleString()}
                  </span>
                  {s.label && <span className="ms-3">{s.label}</span>}
                </div>
                <form
                  action={async (fd) => {
                    "use server";
                    await deleteAvailabilityAction(null, fd);
                  }}
                >
                  <input type="hidden" name="slot_id" value={s.id} />
                  <button type="submit" className="ps-btn ps-btn--ghost text-xs">
                    {t("common.remove", undefined, "Remove")}
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
