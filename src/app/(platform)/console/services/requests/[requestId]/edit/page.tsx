import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateServiceRequest, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("tasks", session.orgId, p.requestId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const action = updateServiceRequest.bind(null, p.requestId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow="Service request"
        title={`Edit ${((row as Record<string, unknown>)["title"] as string | undefined) ?? "Service request"}`}
      />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/services/requests/${p.requestId}`} submitLabel="Save changes">
          <Input label="Title" name="title" defaultValue={row.title ?? ""} required maxLength={200} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Description</span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={5}
              className="input-base focus-ring w-full"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status ?? ""} required className="input-base focus-ring w-full">
              <option value="todo">todo</option>
              <option value="in_progress">in_progress</option>
              <option value="blocked">blocked</option>
              <option value="review">review</option>
              <option value="done">done</option>
            </select>
          </label>
          <Input
            label="Priority"
            name="priority"
            type="number"
            defaultValue={row.priority != null ? String(row.priority) : ""}
          />
          <Input label="Due at" name="due_at" type="datetime-local" defaultValue={dateTimeLocal(row.due_at)} />
        </FormShell>
      </div>
    </>
  );
}
