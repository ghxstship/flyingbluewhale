import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { AvailabilityResponseForm } from "./AvailabilityResponseForm";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  if (!hasSupabase) return notFound();

  const session = await requireSession();
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("crew_availability_requests")
    .select("id, shift_date, shift_start, shift_end, role_note, status, expires_at, project_id")
    .eq("id", requestId)
    .eq("assignee_id", session.userId)
    .maybeSingle();

  if (!request) return notFound();

  let projectName: string | null = null;
  if (request.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("name")
      .eq("id", request.project_id)
      .maybeSingle();
    projectName = project?.name ?? null;
  }

  const expired = new Date(request.expires_at) < new Date();
  const alreadyResponded = request.status !== "pending";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            Availability Check
          </p>
          <h1 className="text-xl font-bold">{request.role_note ?? "Shift Availability"}</h1>
          {projectName && <p className="text-sm text-[var(--text-secondary)]">{projectName}</p>}
          <div className="text-sm font-medium text-[var(--text-secondary)]">
            <p>{request.shift_date}</p>
            {request.shift_start && (
              <p>
                {request.shift_start} – {request.shift_end ?? "TBD"}
              </p>
            )}
          </div>
        </div>

        {alreadyResponded ? (
          <div className="surface rounded-xl p-5 text-center space-y-2">
            <p className="text-sm font-medium">
              You responded:{" "}
              <strong className={request.status === "available" ? "text-green-600" : "text-red-600"}>
                {request.status === "available" ? "Available ✓" : "Unavailable"}
              </strong>
            </p>
            <p className="text-xs text-[var(--text-muted)]">Your response has been recorded.</p>
          </div>
        ) : expired ? (
          <div className="surface rounded-xl p-5 text-center">
            <p className="text-sm text-[var(--text-muted)]">This availability check has expired.</p>
          </div>
        ) : (
          <AvailabilityResponseForm requestId={requestId} />
        )}
      </div>
    </div>
  );
}
