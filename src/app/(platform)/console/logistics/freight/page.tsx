import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Freight" />
      <div className="page-content">
        <RoadmapStub
          title="Freight"
          description="Customs and bonded warehousing. Integrate a TMS (Flexport, project44)."
          inTheMeantime={{ href: "/console/logistics/ratecard", label: "Open the rate card" }}
        />
      </div>
    </>
  );
}
