import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { setPositionActiveAction, updatePositionAction } from "../actions";
import { PositionForm, type Department, type PositionRow } from "../PositionForm";

export const dynamic = "force-dynamic";

export default async function PositionDetailPage({
  params,
}: {
  params: Promise<{ positionId: string }>;
}) {
  const { positionId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Organization Hub" title="Position" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: position }, { data: departmentData }] = await Promise.all([
    db
      .from("positions")
      .select("id, title, department_code, summary, active")
      .eq("org_id", session.orgId)
      .eq("id", positionId)
      .maybeSingle(),
    db.from("dim_department").select("code, label").order("code", { ascending: true }).limit(20),
  ]);
  if (!position) notFound();
  const row = position as PositionRow;
  const departments = (departmentData ?? []) as Department[];
  const deptLabel = departments.find((d) => d.code === row.department_code)?.label;

  return (
    <>
      <ModuleHeader
        eyebrow="Organization Hub"
        title={row.title}
        subtitle={
          row.department_code
            ? `${row.department_code} · ${deptLabel ?? "Department"}`
            : "Unclassified position"
        }
        breadcrumbs={[
          { label: "LEG3ND" },
          { label: "Organization Hub", href: "/legend/hub" },
          { label: "Organization", href: "/legend/hub/organization" },
          { label: row.title },
        ]}
        action={
          <div className="flex items-center gap-3">
            {row.active ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Archived</Badge>}
            <form action={setPositionActiveAction.bind(null, row.id, !row.active)}>
              <Button type="submit" size="sm" variant="secondary">
                {row.active ? "Archive" : "Restore"}
              </Button>
            </form>
          </div>
        }
      />
      <div className="page-content max-w-2xl">
        <PositionForm
          action={updatePositionAction.bind(null, row.id)}
          departments={departments}
          position={row}
          submitLabel="Save Position"
        />
      </div>
    </>
  );
}
