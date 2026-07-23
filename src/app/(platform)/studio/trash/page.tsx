import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { listTrashed } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { TrashTable, type TrashRow } from "./TrashTable";
import { TRASH_TYPES, DEFAULT_TRASH_TABLE, isKnownTrashType, trashRowLabel } from "./types";

export const dynamic = "force-dynamic";

export default async function TrashPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.trash.eyebrow", undefined, "Settings")}
          title={t("console.trash.title", undefined, "Trash")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.trash.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const sp = await searchParams;
  const activeTable = isKnownTrashType(sp?.type) ? (sp!.type as string) : DEFAULT_TRASH_TABLE;
  const activeLabel =
    TRASH_TYPES.find((t) => t.table === activeTable)?.label ?? t("console.trash.recordsFallback", undefined, "Records");

  // Restore is manager+-gated server-side; mirror that here so members don't
  // land on an empty page they can't act on. Nav hides the entry too (minRole).
  if (!isManagerPlus(session)) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.trash.eyebrow", undefined, "Settings")}
          title={t("console.trash.title", undefined, "Trash")}
        />
        <div className="page-content">
          <EmptyState
            title={t("console.trash.managerRequired", undefined, "Manager access required")}
            description={t(
              "console.trash.managerRequiredDescription",
              undefined,
              "Only owners, admins, and managers can browse and restore deleted records.",
            )}
          />
        </div>
      </>
    );
  }

  const raw = (await listTrashed(activeTable as never, session.orgId)) as Array<Record<string, unknown>>;
  const rows: TrashRow[] = raw.map((r) => ({
    id: String(r.id),
    label: trashRowLabel(r),
    deletedAt: typeof r.deleted_at === "string" ? r.deleted_at : null,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.trash.eyebrow", undefined, "Settings")}
        title={t("console.trash.title", undefined, "Trash")}
        subtitle={
          rows.length === 1
            ? t(
                "console.trash.subtitleOne",
                { label: activeLabel },
                `${activeLabel} · 1 deleted record recoverable`,
              )
            : t(
                "console.trash.subtitleMany",
                { label: activeLabel, count: rows.length },
                `${activeLabel} · ${rows.length} deleted records recoverable`,
              )
        }
      />
      <div className="page-content max-w-5xl space-y-4">
        <nav className="flex flex-wrap gap-1.5" aria-label={t("console.trash.recordTypeAria", undefined, "Record type")}>
          {TRASH_TYPES.map((t) => {
            const active = t.table === activeTable;
            return (
              <Link
                key={t.table}
                href={`/studio/trash?type=${t.table}`}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-md bg-[var(--p-accent)] px-3 py-1.5 text-xs font-medium text-white"
                    : "rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium text-[var(--p-text-2)] hover:bg-[var(--p-surface)] hover:text-[var(--p-text-1)]"
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <TrashTable table={activeTable} rows={rows} />
      </div>
    </>
  );
}
