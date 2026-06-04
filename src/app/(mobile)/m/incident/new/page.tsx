import { quickFileIncident } from "./actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /m/incident/new — express incident intake. One field: tap, type a
 * sentence, submit. Designed for one-thumb filing while a crew member
 * is still on the floor. The full multi-field form (severity, body
 * part, photos, OSHA classification) lives at /m/incidents/new.
 */

export default async function QuickFilePage() {
  const { t } = await getRequestT();
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--color-error)] uppercase">
        {t("m.incident.new.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.incident.new.title", undefined, "Quick File")}</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
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
            className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-3 text-base"
          />
        </label>
        <button type="submit" className="btn btn-primary w-full">
          {t("m.incident.new.fileNow", undefined, "File Now")}
        </button>
      </form>
    </div>
  );
}
