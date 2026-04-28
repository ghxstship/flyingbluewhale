import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Gate" />
      <div className="page-content">
        <RoadmapStub
          title="Gate"
          description="Scan accreditation or ticket to grant/deny access."
          inTheMeantime={{ href: "/m/gate/scan", label: "Open scanner" }}
        />
      </div>
    </>
  );
}
