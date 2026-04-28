import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Wayfinding" />
      <div className="page-content">
        <RoadmapStub title="Wayfinding" description="Indoor map and routing." />
      </div>
    </>
  );
}
