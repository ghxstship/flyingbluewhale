export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtDateTime, money } from "@/components/detail/DetailShell";

/**
 * Logistics = rentals whose window overlaps today + next 7 days. Each
 * row is a prospective move (load-out at `starts_at`, load-in back at
 * `ends_at`). No shipments table yet — this is the scheduling surface
 * that would feed one when it's built.
 */
export default async function LogisticsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const in7d = new Date(now.getTime() + 7 * 864e5).toISOString();
  const { data: rentals } = await supabase
    .from("rentals")
    .select("id, equipment_id, project_id, starts_at, ends_at, rate_cents, notes")
    .eq("org_id", session.orgId)
    .or(`and(starts_at.lte.${in7d},ends_at.gte.${nowIso})`)
    .order("starts_at", { ascending: true })
    .limit(50);
  const rows = (rentals ?? []) as Array<{ id: string; equipment_id: string; project_id: string | null; starts_at: string; ends_at: string; rate_cents: number | null; notes: string | null }>;
  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title="Logistics"
        subtitle={`${rows.length} active rental window${rows.length === 1 ? "" : "s"} across the next 7 days`}
      />
      <div className="page-content max-w-5xl">
        {rows.length === 0 ? (
          <EmptyState
            title="Nothing moving this week"
            description="Rentals with overlapping windows surface here as load-out / load-in candidates. Seed a rental against an equipment row to see it appear."
          />
        ) : (
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>Rental</th>
                <th>Load-out</th>
                <th>Load-in</th>
                <th>Rate</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link
                      href={`/console/production/rentals/${r.id}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {r.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="font-mono text-xs">{fmtDateTime(r.starts_at)}</td>
                  <td className="font-mono text-xs">{fmtDateTime(r.ends_at)}</td>
                  <td className="font-mono text-xs">{money(r.rate_cents)}</td>
                  <td className="text-[var(--text-muted)]">{r.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
