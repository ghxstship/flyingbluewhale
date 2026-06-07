import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { updateProgramReview, type State } from "./actions";

export const dynamic = "force-dynamic";

function dateTimeLocal(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.slice(0, 16);
}

export default async function Page({ params }: { params: Promise<{ reviewId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const row = await getOrgScoped("program_reviews", session.orgId, p.reviewId);
  if (!row) notFound();
  const r = row as Record<string, unknown>;
  void r;
  const { t } = await getRequestT();
  const action = updateProgramReview.bind(null, p.reviewId) as unknown as (
    state: State,
    fd: FormData,
  ) => Promise<State>;
  const reviewTitle =
    ((row as Record<string, unknown>)["title"] as string | undefined) ??
    t("console.programs.reviews.edit.fallbackTitle", undefined, "Program review");
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.reviews.edit.eyebrow", undefined, "Program Review")}
        title={t("console.programs.reviews.edit.title", { title: reviewTitle }, `Edit ${reviewTitle}`)}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={action}
          cancelHref={`/console/programs/reviews/${p.reviewId}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={row.updated_at} />
          <Input
            label={t("console.programs.reviews.edit.fields.title", undefined, "Title")}
            name="title"
            defaultValue={row.title ?? ""}
            required
            maxLength={200}
          />
          <Input
            label={t("console.programs.reviews.edit.fields.scheduledAt", undefined, "Scheduled At")}
            name="scheduled_at"
            type="datetime-local"
            defaultValue={dateTimeLocal(row.scheduled_at)}
            required
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.programs.reviews.edit.fields.notes", undefined, "Notes")}
            </span>
            <textarea name="notes" defaultValue={row.notes ?? ""} rows={5} className="ps-input focus-ring w-full" />
          </label>
        </FormShell>
      </div>
    </>
  );
}
