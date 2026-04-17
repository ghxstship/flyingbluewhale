import { ModuleHeader } from "@/components/Shell";
import { NewLeadForm } from "./NewLeadForm";

export default function NewLeadPage() {
  return (
    <>
      <ModuleHeader eyebrow="Sales" title="New lead" />
      <div className="page-content max-w-2xl"><NewLeadForm /></div>
    </>
  );
}
