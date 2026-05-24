import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { DeleteForm } from "@/components/DeleteForm";
import { deleteCategory } from "./edit/actions";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ categoryId: string }> }) {
  const p = await params;
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Category" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const row = await getOrgScoped("accreditation_categories", session.orgId, p.categoryId);
  if (!row) notFound();
  const fields = row as Record<string, unknown>;
  const title = (fields["name"] as string | undefined) ?? (fields["code"] as string | undefined) ?? p.categoryId;
  return (
    <>
      <ModuleHeader
        eyebrow="Accreditation · Category"
        title={title}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/accreditation/categories" variant="ghost" size="sm">
              Back
            </Button>
            <Button href={`/console/accreditation/categories/${p.categoryId}/edit`} size="sm">
              Edit
            </Button>
            <DeleteForm
              action={deleteCategory.bind(null, p.categoryId)}
              confirm={`Delete category "${title}"? This cannot be undone.`}
            />
          </div>
        }
      />
      <div className="page-content max-w-3xl">
        <dl className="surface grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
          {Object.entries(fields).map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <dt className="text-xs tracking-wide text-[var(--text-muted)] uppercase">{toTitle(k)}</dt>
              <dd className="font-mono text-xs break-all">
                {v === null || v === undefined ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
