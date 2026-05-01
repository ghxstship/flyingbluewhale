import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Visa = {
  id: string;
  person_name: string;
  nationality: string | null;
  passport_no: string | null;
  status: string;
  letter_path: string | null;
  delegation: { name: string | null } | null;
  updated_at: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  pending: "muted",
  documents_in: "info",
  letter_issued: "success",
  application_filed: "warning",
  approved: "success",
  denied: "error",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function maskPassport(pass: string | null): string {
  if (!pass) return "—";
  if (pass.length <= 4) return "••" + pass;
  return `${pass.slice(0, 2)}•••••${pass.slice(-2)}`;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Visa Cases" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  // Visa cases are typically filed by the delegation; we surface every row visible
  // to the viewer via RLS so they can see status of their travel docs.
  const { data } = await supabase
    .from("visa_cases")
    .select(
      "id, person_name, nationality, passport_no, status, letter_path, delegation:delegation_id(name), updated_at",
    )
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false });

  const cases = ((data ?? []) as unknown as Visa[]) ?? [];
  const pending = cases.filter((c) => c.status !== "approved" && c.status !== "denied").length;
  const approved = cases.filter((c) => c.status === "approved").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Athlete"
        title="Visa Cases"
        subtitle={`${cases.length} case${cases.length === 1 ? "" : "s"} · ${pending} in progress`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Athlete", href: `/p/${slug}/athlete` },
          { label: "Visa" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Approved" value={approved.toLocaleString()} accent={approved > 0} />
          <MetricCard label="In Progress" value={pending.toLocaleString()} />
          <MetricCard label="Total" value={cases.length.toLocaleString()} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Your Visa Cases</h3>
          {cases.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No cases on file. Your delegation lead opens these on your behalf — they'll request your passport details
              directly.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {cases.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{c.person_name}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {c.nationality ?? "—"} · passport {maskPassport(c.passport_no)}
                      {c.delegation?.name ? ` · ${c.delegation.name}` : ""}
                    </div>
                    {c.letter_path && (
                      <div className="mt-1 font-mono text-[10px] text-[var(--org-primary)]">letter on file</div>
                    )}
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">updated {fmt(c.updated_at)}</div>
                  </div>
                  <Badge variant={STATUS_TONE[c.status] ?? "muted"}>{c.status.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          Passport numbers are masked on screen but retained for letter generation. Email{" "}
          <a className="text-[var(--org-primary)]" href="mailto:visas@lostisland.tech">
            visas@lostisland.tech
          </a>{" "}
          if your case isn't progressing.
        </p>
      </div>
    </>
  );
}
