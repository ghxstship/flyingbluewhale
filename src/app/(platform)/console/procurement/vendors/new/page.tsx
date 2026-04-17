import { ModuleHeader } from "@/components/Shell";
import { NewVendorForm } from "./NewVendorForm";

export default function NewVendorPage() {
  return (
    <>
      <ModuleHeader eyebrow="Procurement" title="New vendor" />
      <div className="page-content max-w-xl"><NewVendorForm /></div>
    </>
  );
}
