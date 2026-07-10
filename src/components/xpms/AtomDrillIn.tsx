"use client";

import { useRouter, usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui";
import { money } from "@/components/detail/DetailShell";
import { useT } from "@/lib/i18n/LocaleProvider";

type Translator = (key: string, vars?: Record<string, string | number>, fallback?: string) => string;

export type AtomMeta = {
  id: string;
  identifier: string;
  name: string;
  state: "uac" | "tpc";
  phase: string;
  wbs_path: string;
};

export type AtomTask = { id: string; title: string; task_state: string; due_at: string | null };
export type AtomDeliverable = {
  id: string;
  title: string | null;
  type: string;
  fulfillment_state: string | null;
  status: string;
  deadline: string | null;
};
export type AtomExpense = { id: string; description: string; amount_cents: number; spent_at: string };
export type AtomPO = {
  id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
  purchase_order_id: string;
};
export type AtomVariance = {
  id: string;
  reason: string;
  cost_delta_cents: number | null;
  qty_delta: number | null;
  recorded_at: string;
  notes: string | null;
};

const TASK_STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  todo: "muted",
  in_progress: "info",
  blocked: "warning",
  review: "info",
  done: "success",
};

const DELIVERABLE_STATE_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  briefed: "muted",
  draft: "muted",
  submitted: "info",
  in_review: "info",
  revision_requested: "warning",
  approved: "success",
  delivered: "success",
  rejected: "error",
};

const TASK_STATUS_FALLBACK: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  review: "Review",
  done: "Done",
};

const DELIVERABLE_STATE_FALLBACK: Record<string, string> = {
  briefed: "Briefed",
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  revision_requested: "Revision Requested",
  approved: "Approved",
  delivered: "Delivered",
  rejected: "Rejected",
};

function taskStatusLabel(status: string, t: Translator): string {
  return t(`components.atomDrillIn.taskStatus.${status}`, undefined, TASK_STATUS_FALLBACK[status] ?? status);
}

function deliverableStateLabel(state: string, t: Translator): string {
  return t(`components.atomDrillIn.deliverableState.${state}`, undefined, DELIVERABLE_STATE_FALLBACK[state] ?? state);
}

/**
 * AtomDrillIn — modal panel rendered when ?atom=<id> is set on a
 * tracker route. Five tabs (Tasks / Submittals / Expenses / POs /
 * Variance) each scoped to artifacts pinned to this atom.
 *
 * Data is fetched server-side by the tracker page and handed in as
 * props. Close gesture clears the search param via router.replace so
 * the dialog state is URL-driven and shareable.
 */
export function AtomDrillIn({
  atom,
  tasks,
  deliverables,
  expenses,
  poLines,
  variances,
}: {
  atom: AtomMeta;
  tasks: AtomTask[];
  deliverables: AtomDeliverable[];
  expenses: AtomExpense[];
  poLines: AtomPO[];
  variances: AtomVariance[];
}) {
  const tr = useT();
  const router = useRouter();
  const pathname = usePathname();
  const close = () => router.replace(pathname);

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent size="xl" className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant={atom.state === "tpc" ? "brand" : "muted"}>{atom.state.toUpperCase()}</Badge>
            <span className="font-mono text-[11px] text-[var(--p-text-2)]">{atom.wbs_path}</span>
          </div>
          <DialogTitle className="mt-1">{atom.name}</DialogTitle>
          <DialogDescription>
            <span className="font-mono text-xs">{atom.identifier}</span>
            <span className="ms-2 text-xs text-[var(--p-text-2)]">· {atom.phase}</span>
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="tasks" className="mt-2">
          <TabsList scrollable>
            <TabsTrigger value="tasks">
              {tr("components.atomDrillIn.tabTasks", undefined, "Tasks")}{" "}
              <span className="ms-1 font-mono text-[11px] text-[var(--p-text-2)]">{tasks.length}</span>
            </TabsTrigger>
            <TabsTrigger value="submittals">
              {tr("components.atomDrillIn.tabSubmittals", undefined, "Submittals")}{" "}
              <span className="ms-1 font-mono text-[11px] text-[var(--p-text-2)]">{deliverables.length}</span>
            </TabsTrigger>
            <TabsTrigger value="expenses">
              {tr("components.atomDrillIn.tabExpenses", undefined, "Expenses")}{" "}
              <span className="ms-1 font-mono text-[11px] text-[var(--p-text-2)]">{expenses.length}</span>
            </TabsTrigger>
            <TabsTrigger value="pos">
              {tr("components.atomDrillIn.tabPos", undefined, "POs")}{" "}
              <span className="ms-1 font-mono text-[11px] text-[var(--p-text-2)]">{poLines.length}</span>
            </TabsTrigger>
            <TabsTrigger value="variance">
              {tr("components.atomDrillIn.tabVariance", undefined, "Variance")}{" "}
              <span className="ms-1 font-mono text-[11px] text-[var(--p-text-2)]">{variances.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-3 space-y-1.5">
            {tasks.length === 0 ? (
              <p className="text-xs text-[var(--p-text-2)]">
                {tr("components.atomDrillIn.noTasks", undefined, "No tasks pinned to this atom.")}
              </p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="surface flex items-center justify-between gap-2 p-2.5 text-sm">
                  <span className="truncate">{task.title}</span>
                  <div className="flex items-center gap-2">
                    {task.due_at && <span className="font-mono text-[11px] text-[var(--p-text-2)]">{task.due_at}</span>}
                    <Badge variant={TASK_STATUS_TONE[task.task_state] ?? "muted"}>
                      {taskStatusLabel(task.task_state, tr)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="submittals" className="mt-3 space-y-1.5">
            {deliverables.length === 0 ? (
              <p className="text-xs text-[var(--p-text-2)]">
                {tr("components.atomDrillIn.noSubmittals", undefined, "No submittals pinned to this atom.")}
              </p>
            ) : (
              deliverables.map((d) => {
                const stateKey = d.fulfillment_state ?? d.status;
                return (
                  <div key={d.id} className="surface flex items-center justify-between gap-2 p-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate">{d.title ?? d.type}</div>
                      <div className="font-mono text-[11px] text-[var(--p-text-2)]">{d.type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.deadline && (
                        <span className="font-mono text-[11px] text-[var(--p-text-2)]">{d.deadline.slice(0, 10)}</span>
                      )}
                      <Badge variant={DELIVERABLE_STATE_TONE[stateKey] ?? "muted"}>
                        {deliverableStateLabel(stateKey, tr)}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="expenses" className="mt-3 space-y-1.5">
            {expenses.length === 0 ? (
              <p className="text-xs text-[var(--p-text-2)]">
                {tr("components.atomDrillIn.noExpenses", undefined, "No expenses pinned to this atom.")}
              </p>
            ) : (
              expenses.map((e) => (
                <div key={e.id} className="surface flex items-center justify-between gap-2 p-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{e.description}</div>
                    <div className="font-mono text-[11px] text-[var(--p-text-2)]">{e.spent_at}</div>
                  </div>
                  <span className="font-mono">{money(e.amount_cents)}</span>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="pos" className="mt-3 space-y-1.5">
            {poLines.length === 0 ? (
              <p className="text-xs text-[var(--p-text-2)]">
                {tr("components.atomDrillIn.noPos", undefined, "No PO line items pinned to this atom.")}
              </p>
            ) : (
              poLines.map((p) => (
                <div key={p.id} className="surface flex items-center justify-between gap-2 p-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{p.description}</div>
                    <div className="font-mono text-[11px] text-[var(--p-text-2)]">
                      {p.quantity} × {money(p.unit_price_cents)}
                    </div>
                  </div>
                  <span className="font-mono">{money(p.quantity * p.unit_price_cents)}</span>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="variance" className="mt-3 space-y-1.5">
            {variances.length === 0 ? (
              <p className="text-xs text-[var(--p-text-2)]">
                {tr("components.atomDrillIn.noVariance", undefined, "No variance entries for this atom.")}
              </p>
            ) : (
              variances.map((v) => (
                <div key={v.id} className="surface p-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="warning">{v.reason}</Badge>
                    {v.cost_delta_cents != null && (
                      <span className="font-mono text-xs">{money(v.cost_delta_cents)}</span>
                    )}
                  </div>
                  {v.notes && <p className="mt-1.5 text-xs text-[var(--p-text-2)]">{v.notes}</p>}
                  <div className="mt-1 font-mono text-[11px] text-[var(--p-text-2)]">
                    {v.recorded_at.slice(0, 19).replace("T", " ")}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
