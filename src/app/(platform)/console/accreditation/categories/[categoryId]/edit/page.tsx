import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { updateCategory, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("accreditation_categories", session.orgId, categoryId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  const action = updateCategory.bind(null, categoryId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Accreditation · Category" title={`Edit ${(r.name as string | undefined) ?? "Category"}`} />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/accreditation/categories/${categoryId}`}
          submitLabel="Save changes"
        >
          <Input label="Code" name="code" maxLength={40} defaultValue={(r.code as string | undefined) ?? ""} required />
          <Input
            label="Name"
            name="name"
            maxLength={120}
            defaultValue={(r.name as string | undefined) ?? ""}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Description</label>
            <textarea
              name="description"
              rows={3}
              maxLength={500}
              className="input-base mt-1.5 w-full"
              defaultValue={(r.description as string | undefined) ?? ""}
            />
          </div>
          <Input label="Color" name="color" maxLength={20} defaultValue={(r.color as string | undefined) ?? ""} />
        </FormShell>
      </div>
    </>
  );
}
