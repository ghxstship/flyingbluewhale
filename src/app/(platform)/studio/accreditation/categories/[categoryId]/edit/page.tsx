import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  const categoryFallback = t("console.accreditation.categories.edit.categoryFallback", undefined, "Category");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.categories.edit.eyebrow", undefined, "Accreditation · Category")}
        title={t(
          "console.accreditation.categories.edit.title",
          { name: (r.name as string | undefined) ?? categoryFallback },
          `Edit ${(r.name as string | undefined) ?? categoryFallback}`,
        )}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/studio/accreditation/categories/${categoryId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.accreditation.categories.edit.codeLabel", undefined, "Code")}
            name="code"
            maxLength={40}
            defaultValue={(r.code as string | undefined) ?? ""}
            required
          />
          <Input
            label={t("console.accreditation.categories.edit.nameLabel", undefined, "Name")}
            name="name"
            maxLength={120}
            defaultValue={(r.name as string | undefined) ?? ""}
            required
          />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.accreditation.categories.edit.descriptionLabel", undefined, "Description")}
            </label>
            <textarea
              name="description"
              rows={3}
              maxLength={500}
              className="ps-input mt-1.5 w-full"
              defaultValue={(r.description as string | undefined) ?? ""}
            />
          </div>
          <Input
            label={t("console.accreditation.categories.edit.colorLabel", undefined, "Color")}
            name="color"
            maxLength={20}
            defaultValue={(r.color as string | undefined) ?? ""}
          />
        </FormShell>
      </div>
    </>
  );
}
