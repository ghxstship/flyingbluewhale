import { EmptySkeleton } from "@/components/mobile/kit";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Kit 32 B5 — first-load shimmer for the inbox room list. Matches the view's
 * chrome so the loaded state doesn't reflow.
 */
export default async function Loading() {
  const { t } = await getRequestT();
  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.inbox.title", undefined, "My Inbox")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.inbox.title", undefined, "My Inbox")}
      </h1>
      <EmptySkeleton
        shimmer
        cols={[
          t("m.inbox.col.conversation", undefined, "Conversation"),
          t("m.inbox.col.updated", undefined, "Updated"),
        ]}
        title={t("common.loading", undefined, "Loading…")}
        hint=""
      />
    </div>
  );
}
