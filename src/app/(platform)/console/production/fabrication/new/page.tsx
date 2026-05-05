import { ModuleHeader } from "@/components/Shell";
import { NewFabForm } from "./NewFabForm";

export default function NewFabPage() {
  return (
    <>
      <ModuleHeader eyebrow="Production" title="New Fabrication Order" />
      <div className="page-content max-w-xl">
        <NewFabForm />
      </div>
    </>
  );
}
