import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getProject } from "@/lib/db/projects";
import { hasSupabase } from "@/lib/env";
import { updateProject, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateOnly(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 10);
}

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getProject(session.orgId, p.projectId);
  if (!row) notFound();
  const action = updateProject.bind(null, p.projectId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Project" title={`Edit ${row.name}`} subtitle={row.slug} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/projects/${p.projectId}`} submitLabel="Save Changes">
          <Input label="Name" name="name" defaultValue={row.name} required maxLength={200} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Status</span>
            <select name="status" defaultValue={row.status} required className="input-base focus-ring w-full">
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
              <option value="archived">archived</option>
              <option value="complete">complete</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Date" name="start_date" type="date" defaultValue={dateOnly(row.start_date)} />
            <Input label="End Date" name="end_date" type="date" defaultValue={dateOnly(row.end_date)} />
          </div>
          <Input
            label="Budget (cents)"
            name="budget_cents"
            type="number"
            defaultValue={row.budget_cents != null ? String(row.budget_cents) : ""}
          />
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
          <p className="text-xs text-[var(--text-muted)]">
            Slug, branding, and FK relationships are managed elsewhere.
          </p>
        </FormShell>
      </div>
    </>
  );
}
