import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { urlFor } from "@/lib/urls";
import { timeAgo } from "@/lib/format";
import { CATALOG_KINDS, CATALOG_KIND_LABEL, type CatalogKind } from "@/lib/db/catalog-kinds";

export const dynamic = "force-dynamic";

/**
 * Catalogs pillar (MIRROR): the master asset catalog by kind + the most
 * recent items, plus the signage library (already LEG3ND-native). Editing
 * stays in the console at /studio/settings/catalog.
 */

type CatalogItem = {
  id: string;
  code: string;
  name: string;
  kind: CatalogKind;
  active: boolean;
  created_at: string;
};

export default async function CatalogsPillarPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Organization Hub" title="Catalogs" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [recentResult, ...kindResults] = await Promise.all([
    db
      .from("master_catalog_items")
      .select("id, code, name, kind, active, created_at")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
    ...CATALOG_KINDS.map((kind) =>
      db
        .from("master_catalog_items")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .eq("kind", kind)
        .is("deleted_at", null),
    ),
  ]);

  const recent = (recentResult.data ?? []) as CatalogItem[];
  const kindCounts = CATALOG_KINDS.map((kind, i) => ({
    kind,
    count: (kindResults[i] as { count: number | null }).count ?? 0,
  }));
  const total = kindCounts.reduce((sum, k) => sum + k.count, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title="Catalogs"
        subtitle={
          total === 1 ? "1 item in the master catalog" : `${total} items in the master catalog`
        }
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Catalogs" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href="/legend/signage" size="sm" variant="secondary">
              Signage library
            </Button>
            <Button href={urlFor("platform", "/settings/catalog")} size="sm">
              Edit in console
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-8">
        {total === 0 ? (
          <EmptyState
            title="The catalog is empty"
            description="The master catalog holds every assignable SKU: tickets, credentials, gear, travel, lodging, and more. Add items in the console."
            action={
              <Button href={urlFor("platform", "/settings/catalog")} variant="secondary">
                Open the catalog
              </Button>
            }
          />
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--p-text-1)]">By kind</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {kindCounts
                  .filter((k) => k.count > 0)
                  .map((k) => (
                    <div key={k.kind} className="surface-inset flex items-baseline justify-between gap-2 p-3">
                      <span className="text-sm text-[var(--p-text-1)]">{CATALOG_KIND_LABEL[k.kind]}</span>
                      <span className="ps-id text-sm text-[var(--p-text-2)]">{k.count}</span>
                    </div>
                  ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--p-text-1)]">Recently added</h2>
              <DataTable<CatalogItem>
                rows={recent}
                emptyLabel="No catalog items"
                columns={[
                  {
                    key: "code",
                    header: "Code",
                    render: (i) => <span className="ps-id">{i.code}</span>,
                    accessor: (i) => i.code,
                  },
                  {
                    key: "name",
                    header: "Name",
                    render: (i) => i.name,
                    accessor: (i) => i.name,
                  },
                  {
                    key: "kind",
                    header: "Kind",
                    render: (i) => CATALOG_KIND_LABEL[i.kind] ?? i.kind,
                    accessor: (i) => i.kind,
                  },
                  {
                    key: "active",
                    header: "State",
                    render: (i) =>
                      i.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge>,
                    accessor: (i) => (i.active ? "active" : "inactive"),
                  },
                  {
                    key: "created",
                    header: "Added",
                    render: (i) => timeAgo(i.created_at),
                    accessor: (i) => i.created_at,
                  },
                ]}
              />
              <p className="text-xs text-[var(--p-text-3)]">
                Showing the 10 most recent items.{" "}
                <Link href={urlFor("platform", "/settings/catalog")} className="focus-ring text-[var(--p-accent-text)] hover:underline">
                  See the full catalog in the console
                </Link>
                .
              </p>
            </section>
          </>
        )}
      </div>
    </>
  );
}
