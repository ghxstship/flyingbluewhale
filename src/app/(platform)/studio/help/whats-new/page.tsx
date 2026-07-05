import { ModuleHeader } from "@/components/Shell";
import { CHANGELOG_ENTRIES } from "@/lib/changelog";
import { getRequestT } from "@/lib/i18n/request";
import { WhatsNewClient } from "./WhatsNewClient";

export const dynamic = "force-dynamic";

/**
 * What's New (kit 21 W6) — console changelog reader over the shared
 * CHANGELOG_ENTRIES SSOT (same source as the marketing /changelog + RSS).
 * Opening it clears the Help-icon unread dot.
 */
export default async function WhatsNewPage() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.help.eyebrow", undefined, "Support")}
        title={t("console.help.whatsNew.title", undefined, "What's New")}
        info={t("console.help.whatsNew.info", undefined, "Every release, newest first — features, improvements, and fixes.")}
        breadcrumbs={[
          { label: t("console.help.hub.title", undefined, "Help"), href: "/studio/help" },
          { label: t("console.help.whatsNew.title", undefined, "What's New") },
        ]}
      />
      <div className="page-content">
        <WhatsNewClient
          entries={CHANGELOG_ENTRIES}
          labels={{
            all: t("console.help.whatsNew.all", undefined, "All"),
            new: t("console.help.whatsNew.new", undefined, "New"),
            improved: t("console.help.whatsNew.improved", undefined, "Improved"),
            empty: t("console.help.whatsNew.empty", undefined, "Nothing here yet."),
          }}
        />
      </div>
    </>
  );
}
