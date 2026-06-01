import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { PipelineBoard } from "./PipelineBoard";

export const dynamic = "force-dynamic";

export const PIPELINE_PHASES = ["applied", "screening", "interview", "offer", "hired", "rejected"] as const;
export type PipelinePhase = (typeof PIPELINE_PHASES)[number];

export type ApplicationCard = {
  id: string;
  pipeline_phase: PipelinePhase;
  pipeline_note: string | null;
  pipeline_moved_at: string | null;
  applicant_name: string | null;
  applicant_email: string | null;
  applied_at: string;
  cover_note: string | null;
};

export default async function Page({ params }: { params: Promise<{ postingId: string }> }) {
  const { postingId } = await params;
  if (!hasSupabase) return notFound();

  const session = await requireSession();
  const supabase = await createClient();

  const { data: posting } = await supabase
    .from("job_postings")
    .select("id, title, status")
    .eq("id", postingId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  if (!posting) return notFound();

  const { data: applications } = await supabase
    .from("job_applications")
    .select(
      "id, pipeline_phase, pipeline_note, pipeline_moved_at, applicant_name, applicant_email, applied_at, cover_note",
    )
    .eq("posting_id", postingId)
    .order("applied_at", { ascending: false })
    .limit(500);

  return (
    <>
      <ModuleHeader
        eyebrow={`Job Posting · ${posting.title}`}
        title="Hiring Pipeline"
        actions={
          <a href={`/console/marketplace/postings/${postingId}`} className="btn btn-ghost text-sm">
            ← Back to posting
          </a>
        }
      />
      <div className="page-content">
        <PipelineBoard
          postingId={postingId}
          initialCards={(applications ?? []) as ApplicationCard[]}
        />
      </div>
    </>
  );
}
