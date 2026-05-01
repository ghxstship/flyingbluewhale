import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

const QUICK_LINKS = [
  { href: "/console/projects/new", label: "+ New Project" },
  { href: "/console/proposals/new", label: "+ New Proposal" },
  { href: "/console/finance/invoices/new", label: "+ New Invoice" },
  { href: "/console/finance/expenses/new", label: "+ Log Expense" },
  { href: "/console/procurement/purchase-orders/new", label: "+ New PO" },
  { href: "/console/tasks/new", label: "+ New Task" },
  { href: "/console/events/new", label: "+ New Event" },
  { href: "/console/ai/assistant", label: "Open AI Assistant" },
];

export default function CommandPage() {
  return (
    <>
      <ModuleHeader title="Command Palette" subtitle="Quick actions and navigation" />
      <div className="page-content">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="surface hover-lift px-4 py-3 text-sm">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
