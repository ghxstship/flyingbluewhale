import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type CredentialRow = {
  id: string;
  kind: string;
  number: string | null;
  issued_on: string | null;
  expires_on: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Training" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("credentials")
    .select("id, kind, number, issued_on, expires_on")
    .eq("org_id", session.orgId)
    .order("expires_on", { ascending: true, nullsFirst: false })
    .limit(500);
  const rows = (data ?? []) as CredentialRow[];

  const now = Date.now();
  const expiringSoon = rows.filter((r) => {
    if (!r.expires_on) return false;
    const days = (new Date(r.expires_on).getTime() - now) / 86_400_000;
    return days >= 0 && days <= 60;
  }).length;
  const expired = rows.filter((r) => r.expires_on && new Date(r.expires_on).getTime() < now).length;

  // Aggregate by kind for quick triage
  const byKind = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    return acc;
  }, {});
  const kindEntries = Object.entries(byKind).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Training"
        subtitle={`${rows.length} credential${rows.length === 1 ? "" : "s"} on file · ${expiringSoon} expiring within 60 days · ${expired} expired`}
        action={
          <Button href="/console/people/credentials/new" size="sm">
            + Add credential
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {kindEntries.length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">By certification kind</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {kindEntries.map(([kind, count]) => (
                <li key={kind} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{kind}</span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <DataTable<CredentialRow>
          rows={rows}
          rowHref={(r) => `/console/people/credentials/${r.id}`}
          emptyLabel="No training credentials tracked"
          emptyDescription="Training is tracked alongside other certifications. Add first-aid, working-at-height, RIGGER, SIA, and similar issued certs to surface them here."
          emptyAction={
            <Button href="/console/people/credentials/new" size="sm">
              + Add credential
            </Button>
          }
          columns={[
            { key: "kind", header: "Kind", render: (r) => r.kind },
            {
              key: "number",
              header: "Number",
              render: (r) => <span className="font-mono text-xs">{r.number ?? "—"}</span>,
            },
            {
              key: "issued",
              header: "Issued",
              render: (r) => formatDate(r.issued_on, "medium"),
              className: "font-mono text-xs",
            },
            {
              key: "expires",
              header: "Expires",
              render: (r) => {
                if (!r.expires_on) return "—";
                const days = Math.ceil((new Date(r.expires_on).getTime() - now) / 86_400_000);
                if (days < 0) return <Badge variant="error">Expired {Math.abs(days)}d ago</Badge>;
                if (days <= 30) return <Badge variant="warning">{days}d</Badge>;
                if (days <= 60) return <Badge variant="muted">{days}d</Badge>;
                return <span className="font-mono text-xs">{formatDate(r.expires_on, "medium")}</span>;
              },
            },
          ]}
        />
      </div>
    </>
  );
}
