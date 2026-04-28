import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Chain of Custody" />
      <div className="page-content">
        <RoadmapStub
          title="Chain of Custody"
          description="Evidence and sample tracking."
          inTheMeantime={{ href: "/console/compliance/coc", label: "Open Chain of Custody" }}
        />
      </div>
    </>
  );
}
