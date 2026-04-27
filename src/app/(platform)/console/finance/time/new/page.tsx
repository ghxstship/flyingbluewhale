import { ModuleHeader } from "@/components/Shell";
import { NewTimeEntryForm } from "./NewTimeEntryForm";

export default function NewTimeEntryPage() {
  return (
    <>
      <ModuleHeader eyebrow="Finance" title="Log Time" />
      <div className="page-content max-w-xl"><NewTimeEntryForm /></div>
    </>
  );
}
