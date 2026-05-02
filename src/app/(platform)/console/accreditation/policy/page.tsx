import Link from "next/link";
import { Check } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: string;
  code: string;
  name: string;
  color: string | null;
};

type ZoneRow = {
  id: string;
  code: string;
  name: string;
  allowed_categories: unknown;
  venue: { name: string | null } | null;
};

function categoriesAllowed(zoneList: unknown): string[] {
  if (!Array.isArray(zoneList)) return [];
  return zoneList.filter((x): x is string => typeof x === "string");
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Accreditation" title="Policy" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: catData }, { data: zoneData }] = await Promise.all([
    supabase
      .from("accreditation_categories")
      .select("id, code, name, color")
      .eq("org_id", session.orgId)
      .order("code", { ascending: true })
      .limit(200),
    supabase
      .from("venue_zones")
      .select("id, code, name, allowed_categories, venue:venue_id(name)")
      .eq("org_id", session.orgId)
      .order("code", { ascending: true })
      .limit(500),
  ]);

  const categories = (catData ?? []) as CategoryRow[];
  const zones = (zoneData ?? []) as unknown as ZoneRow[];

  const totalCells = categories.length * zones.length;
  const allowedCells = zones.reduce((s, z) => s + categoriesAllowed(z.allowed_categories).length, 0);
  const coverage = totalCells > 0 ? Math.round((allowedCells / totalCells) * 100) : null;

  return (
    <>
      <ModuleHeader
        eyebrow="Accreditation"
        title="Policy"
        subtitle={`${categories.length} categor${categories.length === 1 ? "y" : "ies"} × ${zones.length} zone${zones.length === 1 ? "" : "s"}${coverage != null ? ` · ${coverage}% coverage` : ""}`}
        action={
          <Button href="/console/accreditation/categories" variant="secondary" size="sm">
            Manage categories
          </Button>
        }
      />
      <div className="page-content">
        {categories.length === 0 || zones.length === 0 ? (
          <EmptyState
            title="Need Categories + Zones First"
            description="The matrix derives from accreditation_categories and venue_zones. Author at least one of each before the policy renders."
            action={
              <div className="flex items-center gap-2">
                <Link href="/console/accreditation/categories/new" className="btn btn-primary btn-sm">
                  + New Policy
                </Link>
                <Link href="/console/venues" className="btn btn-secondary btn-sm">
                  Open Venues
                </Link>
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Zone (venue)</th>
                  {categories.map((c) => (
                    <th key={c.id} className="text-center">
                      <span
                        className="inline-flex items-center gap-1 font-mono text-xs"
                        style={c.color ? { color: c.color } : undefined}
                        title={c.name}
                      >
                        {c.code}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => {
                  const allowed = new Set(categoriesAllowed(z.allowed_categories));
                  return (
                    <tr key={z.id}>
                      <td>
                        <div className="text-sm font-medium">{z.name}</div>
                        <div className="font-mono text-[10px] text-[var(--text-muted)]">
                          {z.code} · {z.venue?.name ?? "—"}
                        </div>
                      </td>
                      {categories.map((c) => (
                        <td key={c.id} className="text-center">
                          {allowed.has(c.code) || allowed.has(c.id) ? (
                            <Badge variant="success" aria-label="Allowed">
                              <Check size={12} aria-hidden="true" strokeWidth={3} />
                            </Badge>
                          ) : (
                            <span className="text-[var(--text-muted)]" aria-label="Not allowed">
                              ·
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-[var(--text-muted)]">
          A green cell means cardholders of the column's category are allowed in the row's zone. To edit, open the venue
          and use its Zones tab — the <code>allowed_categories</code> array on each zone drives this matrix.
        </p>
      </div>
    </>
  );
}
