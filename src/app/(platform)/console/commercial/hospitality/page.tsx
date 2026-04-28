import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Hospitality" />
      <div className="page-content">
        <RoadmapStub
          title="Hospitality"
          description="Package and guest management."
          inTheMeantime={{ href: "/console/commercial/sponsors", label: "Open Sponsor Entitlements" }}
        />
      </div>
    </>
  );
}
