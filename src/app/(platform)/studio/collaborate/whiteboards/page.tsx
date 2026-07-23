import Link from "next/link";

import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataView } from "@/components/views/DataViewServer";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { listWhiteboards } from "@/lib/db/whiteboards";
import { getRequestT } from "@/lib/i18n/request";
import { WHITEBOARD_STATE_LABELS, type WhiteboardListItem } from "@/lib/whiteboards";

export const dynamic = "force-dynamic";

export default async function WhiteboardsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.collaborate.whiteboards.eyebrow", undefined, "Projects · Plan")}
          title={t("console.collaborate.whiteboards.title", undefined, "Whiteboards")}
        />
        <ConfigureSupabase />
      </>
    );
  }

  const session = await requireSession();
  const boards = await listWhiteboards(session.orgId);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.collaborate.whiteboards.eyebrow", undefined, "Projects · Plan")}
        title={t("console.collaborate.whiteboards.title", undefined, "Whiteboards")}
        subtitle={
          boards.length === 1
            ? t("console.collaborate.whiteboards.subtitleOne", undefined, "1 board")
            : t("console.collaborate.whiteboards.subtitleMany", { count: boards.length }, `${boards.length} boards`)
        }
        action={
          <Link href="/studio/collaborate/whiteboards/new">
            <Button size="sm">{t("console.collaborate.whiteboards.newWhiteboard", undefined, "New Whiteboard")}</Button>
          </Link>
        }
      />
      <div className="page-content">
        <DataView<WhiteboardListItem>
          rows={boards}
          rowHref={(b) => `/studio/collaborate/whiteboards/${b.id}`}
          emptyLabel={t("console.collaborate.whiteboards.empty", undefined, "No whiteboards yet")}
          emptyDescription={t(
            "console.collaborate.whiteboards.emptyDescription",
            undefined,
            "Create a board to sketch plots, seating, signal flow, or run-of-show. Saved as a tldraw canvas.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.collaborate.whiteboards.columns.name", undefined, "Name"),
              render: (b) => b.name,
              accessor: (b) => b.name,
              sortable: true,
            },
            {
              key: "whiteboard_state",
              header: t("console.collaborate.whiteboards.columns.status", undefined, "Status"),
              render: (b) => <StatusBadge status={WHITEBOARD_STATE_LABELS[b.whiteboard_state]} />,
              accessor: (b) => b.whiteboard_state,
              sortable: true,
            },
            {
              key: "updated_at",
              header: t("console.collaborate.whiteboards.columns.updated", undefined, "Updated"),
              render: (b) => timeAgo(b.updated_at),
              accessor: (b) => b.updated_at,
              sortable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
