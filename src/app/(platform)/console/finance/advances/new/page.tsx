import { ModuleHeader } from "@/components/Shell";
import { NewAdvanceForm } from "./NewAdvanceForm";

export default function NewAdvancePage() {
  return (
    <>
      <ModuleHeader eyebrow="Finance" title="Request advance" />
      <div className="page-content max-w-xl"><NewAdvanceForm /></div>
    </>
  );
}
