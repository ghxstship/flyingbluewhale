import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Mobile" title="My Credential" />
      <div className="page-content">
        <RoadmapStub
          title="My Credential"
          description="Your accreditation card. Keep this screen active at the gate."
          inTheMeantime={{ href: "/me/profile", label: "Open profile" }}
        />
      </div>
    </>
  );
}
