import Link from "next/link";
import { getRequestT } from "@/lib/i18n/request";

export default async function CrewHome() {
  const { t } = await getRequestT();
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("m.crew.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.crew.title", undefined, "Today")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t("m.crew.subtitle", undefined, "Your call sheet and clock controls")}
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link href="/m/crew/clock" className="surface p-4">
          <div className="text-sm font-semibold">{t("m.crew.clock.title", undefined, "Clock")}</div>
          <div className="mt-1 text-xs text-[var(--p-text-2)]">{t("m.crew.clock.subtitle", undefined, "In / out")}</div>
        </Link>
        <Link href="/m/tasks" className="surface p-4">
          <div className="text-sm font-semibold">{t("m.crew.tasks.title", undefined, "Tasks")}</div>
          <div className="mt-1 text-xs text-[var(--p-text-2)]">{t("m.crew.tasks.subtitle", undefined, "Today")}</div>
        </Link>
      </div>
    </div>
  );
}
