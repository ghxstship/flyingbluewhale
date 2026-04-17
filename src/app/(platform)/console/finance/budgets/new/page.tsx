import { ModuleHeader } from "@/components/Shell";
import { NewBudgetForm } from "./NewBudgetForm";

export default function NewBudgetPage() {
  return (
    <>
      <ModuleHeader eyebrow="Finance" title="New budget" />
      <div className="page-content max-w-xl"><NewBudgetForm /></div>
    </>
  );
}
