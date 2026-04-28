import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="Handover" />
      <div className="page-content">
        <RoadmapStub
          title="Handover"
          description="Commissioning walk and sign-off."
          inTheMeantime={{ href: "/console/venues", label: "Open Venues" }}
        />
      </div>
    </>
  );
}
