import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Licensing" />
      <div className="page-content">
        <RoadmapStub
          title="Licensing"
          description="Royalty and merchandise tracking."
          inTheMeantime={{ href: "/console/legal/ip", label: "Open IP" }}
        />
      </div>
    </>
  );
}
