import { ModuleHeader } from "@/components/Shell";
import { NewMileageForm } from "./NewMileageForm";

export default function NewMileagePage() {
  return (
    <>
      <ModuleHeader eyebrow="Finance" title="Log mileage" />
      <div className="page-content max-w-xl"><NewMileageForm /></div>
    </>
  );
}
