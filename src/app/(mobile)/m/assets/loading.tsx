import { EmptySkeleton } from "@/components/mobile/kit";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Kit 32 B5 — first-load shimmer for the assets list. Same view shape as the
 * loaded/empty states so the transition doesn't reflow.
 */
export default async function Loading() {
  const { t } = await getRequestT();
  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.assets.title", undefined, "My Assets")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.assets.title", undefined, "My Assets")}
      </h1>
      <EmptySkeleton
        shimmer
        cols={[
          t("m.assets.col.asset", undefined, "Asset"),
          t("m.assets.col.tag", undefined, "Tag"),
          t("m.assets.col.status", undefined, "Status"),
        ]}
        title={t("common.loading", undefined, "Loading…")}
        hint=""
      />
    </div>
  );
}
