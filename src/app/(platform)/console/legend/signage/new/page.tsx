import { ModuleHeader } from "@/components/Shell";
import { NewSignForm } from "./NewSignForm";

export default function NewSignPage() {
  return (
    <>
      <ModuleHeader eyebrow="LEG3ND" title="New Sign" />
      <div className="page-content max-w-2xl">
        <NewSignForm />
      </div>
    </>
  );
}
