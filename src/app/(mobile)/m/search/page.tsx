import { getRequestT } from "@/lib/i18n/request";
import { SearchClient } from "./SearchClient";

/**
 * /m/search — COMPVSS · Global Search (kit 29, Conformance Spec ratified
 * 2026-07-17). App-wide search across tasks, people, assets, docs and
 * spaces; recents + scoped filters; reached from the top bar's search
 * button. The queries run in the searchMobile server action (org-scoped
 * via the session).
 */

export default async function MobileSearchPage() {
  const { t } = await getRequestT();
  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.search.eyebrow", undefined, "Everything")}</div>
      <h1 className="scr-h">{t("m.search.title", undefined, "Search")}</h1>
      <SearchClient
        placeholder={t("m.search.placeholder", undefined, "Search everything…")}
        emptyHint={t(
          "m.search.hint",
          undefined,
          "Search tasks, people, assets, docs, templates, spaces, your calendar and open jobs.",
        )}
        recentsLabel={t("m.search.recents", undefined, "Recent")}
        clearLabel={t("m.search.clear", undefined, "Clear")}
        searchingLabel={t("m.search.searching", undefined, "Searching…")}
        noMatchLabel={t("m.search.noMatch", undefined, "Nothing matches “{q}”.")}
      />
    </div>
  );
}
