import { ModuleHeader } from "@/components/Shell";
import { NewReqForm } from "./NewReqForm";

export default function NewReqPage() {
  return (
    <>
      <ModuleHeader eyebrow="Procurement" title="New requisition" />
      <div className="page-content max-w-xl"><NewReqForm /></div>
    </>
  );
}
