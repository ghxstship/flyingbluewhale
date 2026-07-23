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
import { WHITEBOARD_STATE_LABELS, type WhiteboardListItem } from "@/lib/whiteboards";

export const dynamic = "force-dynamic";

export default async function WhiteboardsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Projects · Plan" title="Whiteboards" />
        <ConfigureSupabase />
      </>
    );
  }

  const session = await requireSession();
  const boards = await listWhiteboards(session.orgId);

  return (
    <>
      <ModuleHeader
        eyebrow="Projects · Plan"
        title="Whiteboards"
        subtitle={boards.length === 1 ? "1 board" : `${boards.length} boards`}
        action={
          <Link href="/studio/collaborate/whiteboards/new">
            <Button size="sm">New Whiteboard</Button>
          </Link>
        }
      />
      <div className="page-content">
        <DataView<WhiteboardListItem>
          rows={boards}
          rowHref={(b) => `/studio/collaborate/whiteboards/${b.id}`}
          emptyLabel="No whiteboards yet"
          emptyDescription="Create a board to sketch plots, seating, signal flow, or run-of-show. Saved as a tldraw canvas."
          columns={[
            {
              key: "name",
              header: "Name",
              render: (b) => b.name,
              accessor: (b) => b.name,
              sortable: true,
            },
            {
              key: "whiteboard_state",
              header: "Status",
              render: (b) => <StatusBadge status={WHITEBOARD_STATE_LABELS[b.whiteboard_state]} />,
              accessor: (b) => b.whiteboard_state,
              sortable: true,
            },
            {
              key: "updated_at",
              header: "Updated",
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
