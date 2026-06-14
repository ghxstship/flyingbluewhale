import Link from "next/link";

import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/DataTable";
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
        <ModuleHeader eyebrow="Collaborate" title="Whiteboards" />
        <ConfigureSupabase />
      </>
    );
  }

  const session = await requireSession();
  const boards = await listWhiteboards(session.orgId);

  return (
    <>
      <ModuleHeader
        eyebrow="Collaborate"
        title="Whiteboards"
        subtitle={
          boards.length === 1 ? "1 board" : `${boards.length} boards`
        }
        action={
          <Link href="/console/collaborate/whiteboards/new">
            <Button size="sm">New Whiteboard</Button>
          </Link>
        }
      />
      <div className="page-content">
        <DataTable<WhiteboardListItem>
          rows={boards}
          rowHref={(b) => `/console/collaborate/whiteboards/${b.id}`}
          emptyLabel="No whiteboards yet"
          emptyDescription="Create a board to sketch plots, seating, signal flow, or run-of-show — saved as a tldraw canvas."
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
              header: "State",
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
