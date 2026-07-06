"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { useT } from "@/lib/i18n/LocaleProvider";
import { Hint } from "@/components/ui/Tooltip";

/**
 * One Front Door — the global "+" (v7.8 zero-training layer,
 * design_handoff_console_rebuild README §"THE ZERO-TRAINING LAYER" #2).
 *
 * Request-FIRST: the things any person on a production needs to ask for
 * (gear & advance, purchases, time off, incident reporting, IT) sit above
 * the operator create-record section, so the "+" is the only intake a new
 * crew member ever has to learn. Requesters track everything in My Work.
 * The long tail of creates stays in ⌘K (every /new route is indexed there).
 */
type MenuEntry = { key: string; label: string; href: string };

const REQUEST_ENTRIES: MenuEntry[] = [
  { key: "gearAdvance", label: "Gear & Advance Request", href: "/studio/advancing/request" },
  { key: "requisition", label: "Purchase Requisition", href: "/studio/procurement/requisitions/new" },
  { key: "timeOff", label: "Time Off", href: "/studio/workforce/time-off" },
  { key: "reportIt", label: "Report It · Incident / Medical / Lost", href: "/studio/operations/incidents/new" },
  { key: "itTicket", label: "IT & Facilities Ticket", href: "/studio/services/requests/new" },
];

const CREATE_ENTRIES: MenuEntry[] = [
  { key: "newProject", label: "New Project", href: "/studio/projects/new" },
  { key: "newTask", label: "New Task", href: "/studio/tasks/new" },
  { key: "newClient", label: "New Client", href: "/studio/clients/new" },
  { key: "newProposal", label: "New Proposal", href: "/studio/proposals/new" },
  { key: "newInvoice", label: "New Invoice", href: "/studio/finance/invoices/new" },
  { key: "newPo", label: "New Purchase Order", href: "/studio/procurement/purchase-orders/new" },
];

export function CreateMenu() {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);

  const item = (e: MenuEntry, group: "request" | "create") => (
    <Link
      key={e.key}
      href={e.href}
      onClick={close}
      className="block truncate rounded-md px-2 py-1.5 text-sm hover:bg-[var(--p-surface)]"
    >
      {t(`createMenu.${group}.${e.key}`, undefined, e.label)}
    </Link>
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Hint label={t("createMenu.triggerHint", undefined, "Create or request")} side="bottom">
        <Popover.Trigger asChild>
          <button
            type="button"
            data-tour="create"
            aria-label={t("createMenu.trigger", undefined, "Create or request")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[var(--p-accent)] text-[var(--p-accent-contrast)] transition-transform hover:brightness-110 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--p-accent)]"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </Popover.Trigger>
      </Hint>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-40 w-72 rounded-lg border border-[var(--p-border)] bg-[var(--p-bg)] p-1 shadow-lg"
        >
          <div className="px-2 pt-1.5 pb-1 font-mono text-[9px] font-bold tracking-[0.14em] text-[var(--p-text-3)] uppercase">
            {t("createMenu.requestHeader", undefined, "Request · One Front Door")}
          </div>
          {REQUEST_ENTRIES.map((e) => item(e, "request"))}
          <div className="my-1 border-t border-[var(--p-border)]" />
          <div className="px-2 pt-1.5 pb-1 font-mono text-[9px] font-bold tracking-[0.14em] text-[var(--p-text-3)] uppercase">
            {t("createMenu.createHeader", undefined, "Create Record")}
          </div>
          {CREATE_ENTRIES.map((e) => item(e, "create"))}
          <div className="my-1 border-t border-[var(--p-border)]" />
          <Link
            href="/studio/my-work"
            onClick={close}
            className="block rounded-md px-2 py-1.5 text-xs text-[var(--p-text-2)] hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
          >
            {t("createMenu.trackInMyWork", undefined, "Track it all in My Work →")}
          </Link>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
