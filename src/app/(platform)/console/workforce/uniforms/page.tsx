import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Uniforms" />
      <div className="page-content">
        <RoadmapStub
          title="Uniforms"
          description="Uniform distribution — inventory tracked in rate_card_items(catalog='uniform')."
          inTheMeantime={{ href: "/console/logistics/ratecard", label: "Open the rate card" }}
        />
      </div>
    </>
  );
}
