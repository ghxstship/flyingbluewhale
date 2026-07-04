import { ModuleHeader } from "@/components/Shell";
import { NewDiscountForm } from "./NewDiscountForm";

export default function NewDiscountPage() {
  return (
    <>
      <ModuleHeader
        eyebrow="Sales"
        title="New Discount Code"
        breadcrumbs={[
          { label: "Marketplace", href: "/studio/marketplace" },
          { label: "Discounts", href: "/studio/marketplace/discounts" },
          { label: "New" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <NewDiscountForm />
      </div>
    </>
  );
}
