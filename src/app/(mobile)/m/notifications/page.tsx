import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Notifications" />
      <div className="page-content">
        <RoadmapStub
          title="Notifications"
          description="Your notifications."
          inTheMeantime={{ href: "/me/notifications", label: "Open notification settings" }}
        />
      </div>
    </>
  );
}
