import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/DataTable";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  CATEGORY_TONE,
  SIGNAGE_CATEGORY_LABELS,
  SIGNAGE_STANDARD_LABELS,
  placementTotals,
  pictogramSymbolId,
  type SignageSign,
  type SignagePlacement,
} from "@/lib/legend_signage";
import { SignPanel } from "@/components/signage/SignPanel";
import { PictogramPreview } from "../PictogramPreview";
import { deleteSign } from "../actions";

export const dynamic = "force-dynamic";

export default async function SignDetail({ params }: { params: Promise<{ signId: string }> }) {
  const { signId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: signRow } = await db
    .from("signage_signs")
    .select("*")
    .eq("id", signId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const sign = (signRow ?? null) as SignageSign | null;
  if (!sign) notFound();

  const { data: placementRows } = await db
    .from("signage_placements")
    .select("*")
    .eq("org_id", session.orgId)
    .eq("sign_id", signId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  const placements = (placementRows ?? []) as SignagePlacement[];
  const totals = placementTotals(placements);

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND · Sign"
        title={sign.name}
        subtitle={sign.code}
        breadcrumbs={[
          { label: "LEG3ND", href: "/legend/signage" },
          { label: "Signage Library", href: "/legend/signage" },
          { label: sign.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={sign.sign_state} />
            <Button href={`/legend/signage/${signId}/edit`} size="sm" variant="secondary">
              Edit
            </Button>
            <Button href={`/legend/signage/${signId}/placements/new`} size="sm">
              + New Placement
            </Button>
            <DeleteForm
              action={deleteSign.bind(null, signId)}
              confirm={`Delete sign "${sign.name}"? Its placements will be removed too.`}
              undo={{ table: "signage_signs", id: signId, redirectTo: "/legend/signage" }}
            />
          </div>
        }
      />
      <div className="page-content space-y-8">
        <div className="surface flex items-center gap-5 p-5">
          <PictogramPreview sign={sign} size={96} />
          <div className="metric-grid flex-1">
            <Field label="Standard">{SIGNAGE_STANDARD_LABELS[sign.standard]}</Field>
            <Field label="Category">{SIGNAGE_CATEGORY_LABELS[sign.category]}</Field>
            <Field label="Colorway">{sign.colorway ?? "—"}</Field>
            <Field label="Pictogram key">
              <span className="font-mono text-xs">{sign.pictogram_key}</span>
            </Field>
            <Field label="Planned">{totals.planned}</Field>
            <Field label="Installed">{totals.installed}</Field>
            <Field label="Removed">{totals.removed}</Field>
            <Field label="Added">{timeAgo(sign.created_at)}</Field>
          </div>
        </div>

        <div className="surface p-5">
          <h3 className="text-sm font-semibold">Wayfinding preview</h3>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            Built to airport standards (ACRP 52 / AIGA-DOT / ISO 7010) — the {SIGNAGE_CATEGORY_LABELS[sign.category]}{" "}
            color function, proportioned to cap height.
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <SignPanel icon={pictogramSymbolId(sign)} label={sign.name} tone={CATEGORY_TONE[sign.category]} size="lg" />
            <SignPanel
              icon={pictogramSymbolId(sign)}
              label={sign.name}
              tone={CATEGORY_TONE[sign.category]}
              size="md"
              arrow="aiga-arrow-right"
            />
          </div>
        </div>

        {sign.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Notes</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{sign.notes}</p>
          </div>
        )}

        <div>
          <h3 className="mb-3 text-sm font-semibold">Placements</h3>
          <DataTable<SignagePlacement>
            rows={placements}
            emptyLabel="No placements yet"
            emptyDescription="Record where this sign is planned, installed, or has been removed."
            columns={[
              {
                key: "location",
                header: "Location",
                render: (r) => r.location,
                accessor: (r) => r.location,
              },
              {
                key: "quantity",
                header: "Qty",
                tabular: true,
                render: (r) => r.quantity,
                accessor: (r) => r.quantity,
              },
              {
                key: "placement_state",
                header: "State",
                render: (r) => <StatusBadge status={r.placement_state} />,
                accessor: (r) => r.placement_state,
              },
              {
                key: "project",
                header: "Project",
                render: (r) => r.project_id ?? "—",
                accessor: (r) => r.project_id ?? null,
              },
              {
                key: "created",
                header: "Added",
                render: (r) => timeAgo(r.created_at),
                accessor: (r) => r.created_at,
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
