import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Rule = {
  id: string;
  name: string;
  trigger_event: string;
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
};

function fmtTrigger(event: string) {
  return event
    .split(".")
    .map((s) => s.replace(/_/g, " "))
    .join(" → ");
}

export default async function AutomationsPage() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Automations" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase to use Automations.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("automation_rules")
    .select("id, name, trigger_event, is_active, run_count, last_run_at, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const rules = (data ?? []) as Rule[];
  const active = rules.filter((r) => r.is_active).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Automations"
        subtitle={`${rules.length} rule${rules.length === 1 ? "" : "s"} · ${active} active`}
        action={
          <Button href="/console/settings/automations/new" size="sm">
            + New Rule
          </Button>
        }
      />
      <div className="page-content">
        {rules.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={32} />}
            title="No automation rules yet"
            description="Automate repetitive workflows by triggering actions when platform events occur."
            action={<Button href="/console/settings/automations/new">Create a rule</Button>}
          />
        ) : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>{t("common.name", undefined, "Name")}</th>
                  <th>Trigger</th>
                  <th>Status</th>
                  <th>Runs</th>
                  <th>Last Run</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/console/settings/automations/${r.id}`} className="font-medium underline-offset-2 hover:underline">
                        {r.name}
                      </Link>
                    </td>
                    <td className="font-mono text-xs">{fmtTrigger(r.trigger_event)}</td>
                    <td>
                      {r.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="muted">Inactive</Badge>
                      )}
                    </td>
                    <td className="font-mono text-xs">{r.run_count}</td>
                    <td className="font-mono text-xs text-[var(--p-text-2)]">
                      {r.last_run_at ? new Date(r.last_run_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
