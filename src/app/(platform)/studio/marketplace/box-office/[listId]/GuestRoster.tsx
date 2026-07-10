"use client";

import { useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";
import {
  GUEST_ENTRY_STATE_LABELS,
  GUEST_ENTRY_STATE_TONE,
  headCount,
  type GuestEntryState,
} from "@/lib/box_office";
import { checkInEntryAction, denyEntryAction, resetEntryAction } from "../actions";

type Entry = {
  id: string;
  guest_name: string;
  plus_ones: number | null;
  entry_state: GuestEntryState;
  scan_code: string | null;
  checked_in_at: string | null;
};

/**
 * Manual roster with per-row door controls — the fallback / supervisor view
 * next to the fast DoorScanner. Each row exposes the legal transitions for
 * its current state (check in, deny, reset).
 */
export function GuestRoster({ listId, entries }: { listId: string; entries: Entry[] }) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  function run(action: (prev: null, fd: FormData) => Promise<{ error?: string } | null>, entryId: string) {
    const fd = new FormData();
    fd.set("entry_id", entryId);
    fd.set("guest_list_id", listId);
    startTransition(async () => {
      const res = await action(null, fd);
      if (res?.error) toast.error(res.error);
    });
  }

  return (
    <section className="surface p-5">
      <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
        {t("console.boxOffice.roster.title", undefined, "Roster")}
      </h2>
      {entries.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("console.boxOffice.roster.empty", undefined, "No guests yet. Add one above.")}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="text-left">{t("console.boxOffice.roster.guest", undefined, "Guest")}</th>
                <th className="text-left">{t("console.boxOffice.roster.heads", undefined, "Heads")}</th>
                <th className="text-left">{t("console.boxOffice.roster.code", undefined, "Code")}</th>
                <th className="text-left">{t("console.boxOffice.roster.state", undefined, "State")}</th>
                <th className="text-right">{t("console.boxOffice.roster.door", undefined, "Door")}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.guest_name}</td>
                  <td className="tabular-nums">{headCount(e)}</td>
                  <td className="font-mono text-xs text-[var(--p-text-2)]">{e.scan_code ?? "—"}</td>
                  <td>
                    <Badge variant={GUEST_ENTRY_STATE_TONE[e.entry_state]}>
                      {GUEST_ENTRY_STATE_LABELS[e.entry_state]}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {e.entry_state === "pending" && (
                        <>
                          <Button size="sm" loading={pending} onClick={() => run(checkInEntryAction, e.id)}>
                            {t("console.boxOffice.roster.checkIn", undefined, "Check In")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={pending}
                            onClick={() => run(denyEntryAction, e.id)}
                          >
                            {t("console.boxOffice.roster.deny", undefined, "Deny")}
                          </Button>
                        </>
                      )}
                      {e.entry_state !== "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={pending}
                          onClick={() => run(resetEntryAction, e.id)}
                        >
                          {t("console.boxOffice.roster.reset", undefined, "Reset")}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
