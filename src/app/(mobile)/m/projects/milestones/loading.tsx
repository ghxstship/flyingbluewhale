import { EmptySkeleton } from "@/components/mobile/kit";
import { HubChrome } from "@/components/mobile/HubChrome";

/** Kit 34 v8.0 — first-load shimmer for Milestones. */
export default function Loading() {
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" active="milestones" canManage={false} />
      <EmptySkeleton shimmer cols={["Milestone", "Phase", "Status"]} title="Loading…" hint="" />
    </div>
  );
}
