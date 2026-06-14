import { ModuleHeader } from "@/components/Shell";
import { NewDiscountForm } from "./NewDiscountForm";

export default function NewDiscountPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Commerce"
        title="New Discount Code"
        breadcrumbs={[
          { label: "Marketplace", href: "/console/marketplace" },
          { label: "Discounts", href: "/console/marketplace/discounts" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewDiscountForm />
      </div>
    </>
  );
}
