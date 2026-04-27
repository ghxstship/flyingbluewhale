import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateFabrication, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("fabrication_orders", session.orgId, p.orderId);
  if (!row) notFound();
  const action = updateFabrication.bind(null, p.orderId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Fabrication order" title={`Edit ${row.title}`} />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/production/fabrication/${p.orderId}`}
          submitLabel="Save changes"
        >
          <Input label="Title" name="title" defaultValue={row.title} required maxLength={200} />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Description</span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={5}
              maxLength={4000}
              className="input-base focus-ring w-full"
            />
          </label>
          <Input label="Due at" name="due_at" type="datetime-local" defaultValue={dateTimeLocal(row.due_at)} />
          <p className="text-xs text-[var(--text-muted)]">Status transitions are managed from the detail page.</p>
        </FormShell>
      </div>
    </>
  );
}
