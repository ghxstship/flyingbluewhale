import { ModuleHeader } from "@/components/Shell";
import { NewAnnouncementForm } from "./NewAnnouncementForm";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Comms · Announcements" title="New Announcement" />
      <div className="page-content max-w-2xl">
        <NewAnnouncementForm />
      </div>
    </>
  );
}
