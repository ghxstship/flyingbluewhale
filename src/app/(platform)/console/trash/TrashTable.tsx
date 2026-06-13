"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo } from "@/lib/format";
import { restoreOrgScoped } from "@/app/(platform)/console/actions/restore";

export type TrashRow = { id: string; label: string; deletedAt: string | null };

/**
 * Client table for the Trash view (P0.1). Lists soft-deleted rows of a single
 * table and restores them in place via {@link restoreOrgScoped} — the same
 * manager+-gated, org-scoped server action that backs the delete-undo toast.
 * On success we drop the row from local state and refresh the route so the
 * record reappears in its normal list.
 */
export function TrashTable({ table, rows }: { table: string; rows: TrashRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(rows);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const restore = (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      const res = await restoreOrgScoped(table, id, "/console/trash");
      if (res?.error) {
        toast.error(res.error);
        setPendingId(null);
        return;
      }
      toast.success("Restored");
      setItems((prev) => prev.filter((r) => r.id !== id));
      setPendingId(null);
      router.refresh();
    });
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing here"
        description="No deleted records of this type. Items you delete elsewhere can be recovered from here."
      />
    );
  }

  return (
    <div className="surface overflow-x-auto">
      <table className="ps-table">
        <thead>
          <tr>
            <th>Record</th>
            <th>Deleted</th>
            <th className="text-right">Actions</th>
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
                  Restore
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
