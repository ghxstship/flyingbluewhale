import { EmptySkeleton } from "@/components/mobile/kit";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Kit 32 B5 — first-load skeleton for the heaviest list. Reuses EmptySkeleton
 * with the shimmer variant so navigation shows the view's real column shape
 * (not a blank pane) while the force-dynamic server component streams in.
 */
export default async function Loading() {
  const { t } = await getRequestT();
  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.tasks.title", undefined, "My Tasks")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.tasks.title", undefined, "My Tasks")}
      </h1>
      <EmptySkeleton
        shimmer
        cols={[
          t("m.tasks.col.task", undefined, "Task"),
          t("m.tasks.group.status", undefined, "Status"),
          t("m.tasks.col.due", undefined, "Due"),
        ]}
        title={t("common.loading", undefined, "Loading…")}
        hint=""
      />
    </div>
  );
}
