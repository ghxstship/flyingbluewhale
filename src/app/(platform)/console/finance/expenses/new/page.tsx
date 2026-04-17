import { ModuleHeader } from "@/components/Shell";
import { NewExpenseForm } from "./NewExpenseForm";

export default function NewExpensePage() {
  return (
    <>
      <ModuleHeader eyebrow="Finance" title="Log expense" />
      <div className="page-content max-w-xl"><NewExpenseForm /></div>
    </>
  );
}
