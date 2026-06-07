import { ClockInOut } from "./ClockInOut";
import { getOpenShiftAction } from "./actions";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Field-shell clock page. Resolves the user's currently-open shift
 * (if any) on the server so a refresh restores the running timer
 * instead of dropping the user back to "ready to start".
 */
export default async function ClockPage() {
  const initial = await getOpenShiftAction();
  const { t } = await getRequestT();
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("m.clock.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.clock.title", undefined, "Clock")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t("m.clock.subtitle", undefined, "Geo-verified time tracking")}
      </p>
      <div className="mt-6">
        <ClockInOut initial={initial} />
      </div>
    </div>
  );
}
