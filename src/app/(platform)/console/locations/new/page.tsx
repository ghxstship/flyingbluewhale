import { ModuleHeader } from "@/components/Shell";
import { NewLocationForm } from "./NewLocationForm";

export default function NewLocationPage() {
  return (
    <>
      <ModuleHeader eyebrow="Work" title="Add location" />
      <div className="page-content max-w-xl"><NewLocationForm /></div>
    </>
  );
}
