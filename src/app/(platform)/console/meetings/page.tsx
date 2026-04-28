import { ModuleHeader } from "@/components/Shell";
import { RoadmapStub } from "@/components/RoadmapStub";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Meetings" />
      <div className="page-content">
        <RoadmapStub
          title="Meetings"
          description="Technical meetings, Chef-de-Mission interfaces, team leaders' briefings. RSVPs and minutes captured per meeting."
          inTheMeantime={{ href: "/console/events", label: "Open Events" }}
        />
      </div>
    </>
  );
}
