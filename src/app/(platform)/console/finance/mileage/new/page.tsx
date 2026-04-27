import { ModuleHeader } from "@/components/Shell";
import { NewMileageForm } from "./NewMileageForm";

export default function NewMileagePage() {
  return (
    <>
      <ModuleHeader eyebrow="Finance" title="Log Mileage" />
      <div className="page-content max-w-xl"><NewMileageForm /></div>
    </>
  );
}
