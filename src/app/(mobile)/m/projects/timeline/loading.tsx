import { EmptySkeleton } from "@/components/mobile/kit";
import { HubChrome } from "@/components/mobile/HubChrome";
import { getRequestT } from "@/lib/i18n/request";

/** Kit 34 v8.0 — first-load shimmer for the Projects Timeline. */
export default async function Loading() {
  const { t } = await getRequestT();
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" active="timeline" canManage={false} />
      <EmptySkeleton
        shimmer
        cols={[
          t("m.projects.col.phase", undefined, "Phase"),
          t("m.projects.tl.progress", undefined, "Progress"),
        ]}
        title={t("common.loading", undefined, "Loading…")}
        hint=""
      />
    </div>
  );
}
