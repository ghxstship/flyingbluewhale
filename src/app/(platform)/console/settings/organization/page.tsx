import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrgSettingsPage() {
  if (!hasSupabase) return <><ModuleHeader title="Organization" /><div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div></>;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: org } = await supabase.from("orgs").select("*").eq("id", session.orgId).maybeSingle();
  if (!org) return <><ModuleHeader title="Organization" /><div className="page-content"><div className="surface p-6 text-sm">Organization not found.</div></div></>;

  const { count: members } = await supabase.from("memberships").select("*", { count: "exact", head: true }).eq("org_id", session.orgId);

  return (
    <>
      <ModuleHeader eyebrow="Settings" title={org.name} subtitle={`${members ?? 0} members · ${org.tier}`} />
      <div className="page-content space-y-6 max-w-3xl">
        <div className="surface p-5 space-y-3">
          <Field label="Name" value={org.name} />
          <Field label="Slug" value={org.slug} mono />
          <Field label="Tier" value={<Badge variant="brand">{org.tier}</Badge>} />
          <Field label="Created" value={formatDate(org.created_at, "medium")} mono />
        </div>
      </div>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3 last:border-none last:pb-0">
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</div>
      <div className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
