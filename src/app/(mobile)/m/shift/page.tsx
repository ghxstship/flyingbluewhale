import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Shift" />
      <div className="page-content">
        <RoadmapStub
          title="Shift"
          description="Today's shift — check in, break, check out, meal credits."
          inTheMeantime={{ href: "/m/checkin", label: "Open check-in" }}
        />
      </div>
    </>
  );
}
