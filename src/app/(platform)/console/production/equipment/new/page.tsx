import { ModuleHeader } from "@/components/Shell";
import { NewEquipmentForm } from "./NewEquipmentForm";

export default function NewEquipmentPage() {
  return (
    <>
      <ModuleHeader eyebrow="Production" title="Add equipment" />
      <div className="page-content max-w-xl"><NewEquipmentForm /></div>
    </>
  );
}
