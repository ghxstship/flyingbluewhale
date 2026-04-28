import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Press Conferences" />
      <div className="page-content">
        <RoadmapStub
          title="Press Conferences"
          description="Scheduled press conferences. Media RSVPs via the /p/[slug]/media/pressconf portal."
          inTheMeantime={{ href: "/console/events", label: "Open Events" }}
        />
      </div>
    </>
  );
}
