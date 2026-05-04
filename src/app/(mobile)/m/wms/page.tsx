import Link from "next/link";
import { Package, ScanLine } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type EquipmentRow = {
  id: string;
  name: string;
  asset_tag: string | null;
  category: string | null;
  status: string;
};

type RentalRow = {
  id: string;
  ends_at: string;
  equipment: { name: string | null; asset_tag: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  available: "success",
  reserved: "info",
  in_use: "info",
  maintenance: "warning",
  retired: "muted",
};

export default async function MobileWmsPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDay = (iso: string): string => fmt.dateParts(iso, { month: "short", day: "numeric" });
  const [{ data: maintData }, { data: rentalsData }] = await Promise.all([
    supabase
      .from("equipment")
      .select("id, name, asset_tag, category, status")
      .eq("org_id", session.orgId)
      .eq("status", "maintenance")
      .order("name", { ascending: true })
      .limit(20),
    supabase
      .from("rentals")
      .select("id, ends_at, equipment:equipment_id(name, asset_tag)")
      .eq("org_id", session.orgId)
      .gte("ends_at", new Date().toISOString())
      .order("ends_at", { ascending: true })
      .limit(20),
  ]);

  const maintenance = (maintData ?? []) as EquipmentRow[];
  const rentals = (rentalsData ?? []) as unknown as RentalRow[];

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--brand-color,var(--org-primary))] uppercase">
        Field
      </div>
      <h1 className="mt-1 text-2xl font-semibold">Warehouse</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Pick, put-away, and check-in/out via scan.</p>

      <section className="mt-5 grid grid-cols-2 gap-2">
        <Link href="/m/inventory/scan" className="surface flex flex-col items-center gap-1 p-4 text-sm font-medium">
          <ScanLine size={20} />
          Scan asset
        </Link>
        <Link
          href="/console/production/equipment"
          className="surface flex flex-col items-center gap-1 p-4 text-sm font-medium"
        >
          <Package size={20} />
          Asset register
        </Link>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">In Maintenance</h2>
        <ul className="mt-3 space-y-2">
          {maintenance.length === 0 ? (
            <li>
              <EmptyState size="compact" title="No Items in Maintenance" />
            </li>
          ) : (
            maintenance.map((r) => (
              <li key={r.id} className="surface flex items-center justify-between p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="font-mono text-xs text-[var(--text-muted)]">
                    {r.asset_tag ?? "no tag"}
                    {r.category ? ` · ${r.category}` : ""}
                  </div>
                </div>
                <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status}</Badge>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Returns Due</h2>
        <ul className="mt-3 space-y-2">
          {rentals.length === 0 ? (
            <li>
              <EmptyState size="compact" title="No Returns Scheduled" />
            </li>
          ) : (
            rentals.map((r) => (
              <li key={r.id} className="surface flex items-center justify-between p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{r.equipment?.name ?? "—"}</div>
                  <div className="font-mono text-xs text-[var(--text-muted)]">{r.equipment?.asset_tag ?? ""}</div>
                </div>
                <Badge variant="muted">Due {fmtDay(r.ends_at)}</Badge>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
