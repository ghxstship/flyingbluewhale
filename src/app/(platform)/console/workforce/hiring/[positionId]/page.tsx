import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Position = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  employment_type: string | null;
  description: string | null;
  phase: string;
  applicant_count: number;
  created_at: string;
};

type Applicant = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  stage: string;
  notes: string | null;
  applied_at: string;
};

export default async function Page({ params }: { params: Promise<{ positionId: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { positionId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: positionData } = await supabase
    .from("job_positions")
    .select("id, title, department, location, employment_type, description, phase, applicant_count, created_at")
    .eq("id", positionId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!positionData) notFound();
  const position = positionData as unknown as Position;

  const { data: applicantData } = await supabase
    .from("job_applicants")
    .select("id, full_name, email, phone, stage, notes, applied_at")
    .eq("position_id", positionId)
    .order("applied_at", { ascending: false });
  const applicants = (applicantData ?? []) as unknown as Applicant[];

  const stageVariant = (stage: string) => {
    switch (stage) {
      case "new":
        return "info" as const;
      case "reviewing":
        return "warning" as const;
      case "shortlisted":
        return "success" as const;
      case "hired":
        return "success" as const;
      case "rejected":
        return "muted" as const;
      default:
        return "muted" as const;
    }
  };

  return (
    <>
      <ModuleHeader
        eyebrow="Hiring"
        title={position.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={position.phase === "open" ? "success" : position.phase === "filled" ? "info" : "muted"}>
              {position.phase}
            </Badge>
            {position.employment_type && (
              <span className="font-mono text-xs">{position.employment_type.replace("_", " ")}</span>
            )}
            {position.department && (
              <span className="font-mono text-xs">{position.department}</span>
            )}
            {position.location && (
              <span className="font-mono text-xs">{position.location}</span>
            )}
          </span>
        }
        action={
          <Button href={`/console/workforce/hiring/${positionId}/new`} size="sm">
            + Add Applicant
          </Button>
        }
      />
      <div className="page-content grid gap-4">
        {position.description && (
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{position.description}</p>
          </section>
        )}

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Applicants ({applicants.length})</h2>
          {applicants.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--text-muted)]">No applicants yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {applicants.map((a) => (
                <li key={a.id} className="rounded-md border border-[var(--border-color)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{a.full_name}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{a.email}</div>
                      {a.phone && <div className="font-mono text-xs text-[var(--text-muted)]">{a.phone}</div>}
                      {a.notes && (
                        <div className="mt-1 text-xs text-[var(--text-secondary)]">{a.notes}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={stageVariant(a.stage)}>{a.stage}</Badge>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        {new Date(a.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
