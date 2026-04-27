import { ModuleHeader } from "@/components/Shell";
import { NewClientForm } from "./NewClientForm";

export default function NewClientPage() {
  return (
    <>
      <ModuleHeader eyebrow="Sales" title="New Client" />
      <div className="page-content max-w-2xl">
        <NewClientForm />
      </div>
    </>
  );
}
