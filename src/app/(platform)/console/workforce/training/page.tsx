import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Training Catalog" />
      <div className="page-content">
        <RoadmapStub
          title="Training Catalog"
          description="Training courses and assignments. Integrate an LMS (Docebo, TalentLMS) to deliver content."
          inTheMeantime={{ href: "/console/people/credentials", label: "Open Credentials" }}
        />
      </div>
    </>
  );
}
