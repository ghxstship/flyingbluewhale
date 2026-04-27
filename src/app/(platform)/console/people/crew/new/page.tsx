import { ModuleHeader } from "@/components/Shell";
import { NewCrewForm } from "./NewCrewForm";

export default function NewCrewPage() {
  return (
    <>
      <ModuleHeader eyebrow="People" title="Add Crew Member" />
      <div className="page-content max-w-xl"><NewCrewForm /></div>
    </>
  );
}
