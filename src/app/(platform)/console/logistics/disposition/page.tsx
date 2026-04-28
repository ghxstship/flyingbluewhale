import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Disposition" />
      <div className="page-content">
        <RoadmapStub title="Disposition" description="Asset disposition and circularity." />
      </div>
    </>
  );
}
