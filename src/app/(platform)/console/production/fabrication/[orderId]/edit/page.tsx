import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  const action = updateFabrication.bind(null, p.orderId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.fabrication.edit.eyebrow", undefined, "Fabrication Order")}
        title={t("console.production.fabrication.edit.title", { title: row.title }, `Edit ${row.title}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/production/fabrication/${p.orderId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.production.fabrication.edit.titleLabel", undefined, "Title")}
            name="title"
            defaultValue={row.title}
            required
            maxLength={200}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.production.fabrication.edit.descriptionLabel", undefined, "Description")}
            </span>
            <textarea
              name="description"
              defaultValue={row.description ?? ""}
              rows={5}
              maxLength={4000}
              className="ps-input focus-ring w-full"
            />
          </label>
          <Input
            label={t("console.production.fabrication.edit.dueAtLabel", undefined, "Due At")}
            name="due_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.due_at)}
          />
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.production.fabrication.edit.statusHint",
              undefined,
              "Status transitions are managed from the detail page.",
            )}
          </p>
        </FormShell>
      </div>
    </>
  );
}
