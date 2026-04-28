import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Safeguarding" />
      <div className="page-content">
        <RoadmapStub
          title="Safeguarding"
          description="File a confidential safeguarding report."
          inTheMeantime={{ href: "/console/safety/safeguarding", label: "Open Safeguarding" }}
        />
      </div>
    </>
  );
}
