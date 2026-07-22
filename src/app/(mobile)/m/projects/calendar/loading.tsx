import { EmptySkeleton } from "@/components/mobile/kit";
import { HubChrome } from "@/components/mobile/HubChrome";
import { getRequestT } from "@/lib/i18n/request";

/** Kit 34 v8.0 — first-load shimmer for Project Calendar. */
export default async function Loading() {
  const { t } = await getRequestT();
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" active="calendar" canManage={false} />
      <EmptySkeleton
        shimmer
        cols={[
          t("m.projects.cal.col.event", undefined, "Event"),
          t("m.projects.cal.col.when", undefined, "When"),
          t("m.projects.col.status", undefined, "Status"),
        ]}
        title={t("common.loading", undefined, "Loading…")}
        hint=""
      />
    </div>
  );
}
