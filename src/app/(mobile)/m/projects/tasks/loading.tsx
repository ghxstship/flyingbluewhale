import { EmptySkeleton } from "@/components/mobile/kit";
import { HubChrome } from "@/components/mobile/HubChrome";

/** Kit 34 v8.0 — first-load shimmer for Project Tasks (same shape as loaded). */
export default function Loading() {
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" active="tasks" canManage={false} />
      <EmptySkeleton shimmer cols={["Task", "Coordinate", "Status"]} title="Loading…" hint="" />
    </div>
  );
}
