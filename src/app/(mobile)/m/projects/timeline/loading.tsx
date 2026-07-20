import { EmptySkeleton } from "@/components/mobile/kit";
import { HubChrome } from "@/components/mobile/HubChrome";

/** Kit 34 v8.0 — first-load shimmer for the Projects Timeline. */
export default function Loading() {
  return (
    <div className="screen screen-anim">
      <HubChrome hubKey="projects" active="timeline" canManage={false} />
      <EmptySkeleton shimmer cols={["Phase", "Progress"]} title="Loading…" hint="" />
    </div>
  );
}
