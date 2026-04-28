import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Alerts" />
      <div className="page-content">
        <RoadmapStub
          title="Alerts"
          description="Crisis notifications — acknowledge receipt."
          inTheMeantime={{ href: "/console/safety/crisis", label: "Open Crisis Alerts" }}
        />
      </div>
    </>
  );
}
