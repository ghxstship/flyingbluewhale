import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";

const QUICK_LINKS = [
  { href: "/console/projects/new", label: "+ New project" },
  { href: "/console/proposals/new", label: "+ New proposal" },
  { href: "/console/finance/invoices/new", label: "+ New invoice" },
  { href: "/console/finance/expenses/new", label: "+ Log expense" },
  { href: "/console/procurement/purchase-orders/new", label: "+ New PO" },
  { href: "/console/tasks/new", label: "+ New task" },
  { href: "/console/events/new", label: "+ New event" },
  { href: "/console/ai/assistant", label: "Open AI assistant" },
];

export default function CommandPage() {
  return (
    <>
      <ModuleHeader title="Command palette" subtitle="Quick actions and navigation" />
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
