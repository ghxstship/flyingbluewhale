import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Member = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  kind: string;
  venue_id: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Application received",
  in_review: "Under review",
  approved: "Approved — onboarding",
  active: "Active volunteer",
  declined: "Declined",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Volunteer Application" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDate = (iso: string): string => fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });
  const { data } = await supabase
    .from("workforce_members")
    .select("id, full_name, email, phone, role, kind, venue_id, created_at")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .eq("kind", "volunteer")
    .maybeSingle();

  const member = data as Member | null;
  const status = member ? "active" : "pending";

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Volunteer"
        title="Application"
        subtitle={STATUS_LABEL[status]}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Volunteer", href: `/p/${slug}/volunteer` },
          { label: "Application" },
        ]}
        action={<Badge variant={member ? "success" : "warning"}>{status}</Badge>}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Status" value={STATUS_LABEL[status]} accent={Boolean(member)} />
          <MetricCard label="Role" value={member?.role ?? "TBD"} />
          <MetricCard label="Joined" value={member ? fmtDate(member.created_at) : "—"} />
        </div>

        {member ? (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">Your Profile</h3>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--text-muted)]">Name</dt>
              <dd>{member.full_name}</dd>
              <dt className="text-[var(--text-muted)]">Email</dt>
              <dd className="font-mono text-xs">{member.email ?? "—"}</dd>
              <dt className="text-[var(--text-muted)]">Phone</dt>
              <dd className="font-mono text-xs">{member.phone ?? "—"}</dd>
              <dt className="text-[var(--text-muted)]">Role</dt>
              <dd>{member.role ?? "TBD"}</dd>
            </dl>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              Need to update your details? Email{" "}
              <a className="text-[var(--org-primary)]" href="mailto:volunteers@flytehaus.live">
                volunteers@flytehaus.live
              </a>
              .
            </p>
          </section>
        ) : (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">Submit Your Application</h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              We're recruiting volunteers for the upcoming event window. Applications take ~10 minutes — you'll need
              your contact details, availability, and any relevant skills.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`mailto:volunteers@flytehaus.live?subject=Volunteer%20application%20—%20${slug}`}
                className="btn btn-primary btn-sm"
              >
                Email volunteer team
              </Link>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
