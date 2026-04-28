import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Workforce Housing" />
      <div className="page-content">
        <RoadmapStub
          title="Workforce Housing"
          description="Billeting assignments. Book rooms via Accommodation → Group blocks."
          inTheMeantime={{ href: "/console/accommodation/blocks", label: "Open Group Blocks" }}
        />
      </div>
    </>
  );
}
