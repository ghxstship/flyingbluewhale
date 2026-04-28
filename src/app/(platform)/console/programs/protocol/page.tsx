import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Protocol" />
      <div className="page-content">
        <RoadmapStub
          title="Protocol"
          description="VIP itineraries and dignitary management rules. Coordinates with Accommodation, Transport (T3 fleet), and Accreditation (VIP categories)."
          inTheMeantime={{ href: "/console/accommodation/blocks", label: "Open Group Blocks" }}
        />
      </div>
    </>
  );
}
