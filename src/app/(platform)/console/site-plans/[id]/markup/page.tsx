import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import MarkupLoader from "../markup-loader";

export const dynamic = "force-dynamic";

type Sheet = {
  id: string;
  code: string;
  title: string;
  storage_path: string | null;
  calibration_in_per_ft: number | null;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { id } = await params;

  const { data: row } = await supabase
    .from("site_plans")
    .select("id, code, title, storage_path")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) notFound();
  const sheet = row as unknown as Sheet;

  // Calibration column might or might not be present yet; safe default.
  const cal = (sheet as { calibration_in_per_ft?: number | null }).calibration_in_per_ft ?? null;

  return (
    <>
      <ModuleHeader
        eyebrow="Drawings"
        title={`${sheet.code} · Markup`}
        subtitle={sheet.title}
        action={
          <Button href={`/console/site-plans/${sheet.id}`} size="sm" variant="ghost">
            ← Back to Sheet
          </Button>
        }
      />
      <div className="page-content space-y-3">
        {sheet.storage_path ? (
          <MarkupLoader
            siteplanId={sheet.id}
            pdfUrl={`/api/v1/site-plans/${sheet.id}/pdf`}
            calibrationInchesPerFoot={cal}
          />
        ) : (
          <div className="surface p-6 text-sm">
            No PDF attached to this sheet yet. Upload one to the &lsquo;site-plans&rsquo; bucket at path{" "}
            <code className="font-mono text-xs">
              site-plans/{session.orgId}/{sheet.id}.pdf
            </code>{" "}
            and set <code className="font-mono text-xs">site_plans.storage_path</code> to that key.
          </div>
        )}
      </div>
    </>
  );
}
