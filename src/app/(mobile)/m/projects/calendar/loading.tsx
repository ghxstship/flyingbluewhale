import { EmptySkeleton } from "@/components/mobile/kit";
import { HubChrome } from "@/components/mobile/HubChrome";

/** Kit 34 v8.0 — first-load shimmer for Project Calendar. */
export default function Loading() {
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" active="calendar" canManage={false} />
      <EmptySkeleton shimmer cols={["Event", "When", "Status"]} title="Loading…" hint="" />
    </div>
  );
}
