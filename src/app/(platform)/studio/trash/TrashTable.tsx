"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo } from "@/lib/format";
import { restoreOrgScoped } from "@/app/(platform)/studio/actions/restore";

import { useActionErrorResolver } from "@/lib/errors-client";
import { useT } from "@/lib/i18n/LocaleProvider";
export type TrashRow = { id: string; label: string; deletedAt: string | null };

/**
 * Client table for the Trash view (P0.1). Lists soft-deleted rows of a single
 * table and restores them in place via {@link restoreOrgScoped} — the same
 * manager+-gated, org-scoped server action that backs the delete-undo toast.
 * On success we drop the row from local state and refresh the route so the
 * record reappears in its normal list.
 */
export function TrashTable({ table, rows }: { table: string; rows: TrashRow[] }) {
  const t = useT();
  const router = useRouter();
  const resolveErr = useActionErrorResolver();
  const [items, setItems] = useState(rows);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const restore = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      const res = await restoreOrgScoped(table, id, "/studio/trash");
      if (res?.error) {
        toast.error(resolveErr(res.error));
        setPendingId(null);
        return;
      }
      toast.success(t("console.trash.restored", undefined, "Restored"));
      setItems((prev) => prev.filter((r) => r.id !== id));
      setPendingId(null);
      router.refresh();
    });
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title={t("console.trash.empty", undefined, "Nothing here")}
        description={t(
          "console.trash.emptyDescription",
          undefined,
          "No deleted records of this type. Items you delete elsewhere can be recovered from here.",
        )}
      />
    );
  }

  return (
    <div className="surface overflow-x-auto">
      <table className="ps-table">
        <thead>
          <tr>
            <th>{t("console.trash.columns.record", undefined, "Record")}</th>
            <th>{t("console.trash.columns.deleted", undefined, "Deleted")}</th>
            <th className="text-right">{t("console.trash.columns.actions", undefined, "Actions")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td className="font-medium text-[var(--p-text-1)]">{r.label}</td>
              <td className="text-[var(--p-text-2)]">{r.deletedAt ? timeAgo(r.deletedAt) : "—"}</td>
              <td className="text-right">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  loading={pendingId === r.id}
                  onClick={() => restore(r.id)}
                >
                  {t("console.trash.restore", undefined, "Restore")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
