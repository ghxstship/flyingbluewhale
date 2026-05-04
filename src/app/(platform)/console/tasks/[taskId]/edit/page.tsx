import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateTask, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ taskId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("tasks", session.orgId, p.taskId);
  if (!row) notFound();
  const action = updateTask.bind(null, p.taskId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Task" title={`Edit ${row.title}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/tasks/${p.taskId}`} submitLabel="Save Changes">
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input label="Title" name="title" defaultValue={row.title} required maxLength={200} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Description</span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={6}
              maxLength={8000}
              className="input-base focus-ring w-full"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status} required className="input-base focus-ring w-full">
              <option value="todo">todo</option>
              <option value="in_progress">in_progress</option>
              <option value="blocked">blocked</option>
              <option value="review">review</option>
              <option value="done">done</option>
            </select>
          </label>
          <Input
            label="Priority (0-3)"
            name="priority"
            type="number"
            min={0}
            max={3}
            defaultValue={String(row.priority ?? 0)}
          />
          <Input label="Due At" name="due_at" type="datetime-local" defaultValue={dateTimeLocal(row.due_at)} />
        </FormShell>
      </div>
    </>
  );
}
