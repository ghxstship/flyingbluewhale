import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import type { CrewMember } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function CrewPage() {
  if (!hasSupabase) return <><ModuleHeader title="Crew" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const rows = await listOrgScoped("crew_members", session.orgId, { orderBy: "name", ascending: true });
  return (
    <>
      <ModuleHeader eyebrow="People" title="Crew" subtitle={`${rows.length} crew member${rows.length === 1 ? "" : "s"}`}
        action={<Button href="/console/people/crew/new">+ Add crew</Button>} />
      <div className="page-content">
        <DataTable<CrewMember>
          rows={rows}
          rowHref={(r) => `/console/people/crew/${r.id}`}
          columns={[
            { key: "name", header: "Name", render: (r) => r.name },
            { key: "role", header: "Role", render: (r) => r.role ?? "—", className: "font-mono text-xs" },
            { key: "email", header: "Email", render: (r) => r.email ?? "—", className: "font-mono text-xs" },
            { key: "phone", header: "Phone", render: (r) => r.phone ?? "—", className: "font-mono text-xs" },
            { key: "rate", header: "Day rate", render: (r) => formatMoney(r.day_rate_cents), className: "font-mono text-xs" },
          ]}
        />
        <div className="mt-4 text-xs text-[var(--text-muted)]">
          Need to manage certifications? <Link href="/console/people/credentials" className="text-[var(--org-primary)]">Open credentials →</Link>
        </div>
      </div>
    </>
  );
}
