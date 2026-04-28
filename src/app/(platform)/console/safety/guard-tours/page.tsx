import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Guard Tours" />
      <div className="page-content">
        <RoadmapStub
          title="Guard Tours"
          description="Patrol plans and logs. Mobile patrol via /m/guard."
          inTheMeantime={{ href: "/m/guard", label: "Open mobile Guard" }}
        />
      </div>
    </>
  );
}
