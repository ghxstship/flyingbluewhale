import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRequestT } from "@/lib/i18n/request";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

/**
 * /p/select — portal project chooser.
 *
 * /auth/resolve sends portal personas here when no `?slug=` was carried
 * through login. Before this page existed, that default slug 404'd at
 * the [slug] layout and stranded every client/contractor who signed in
 * from plain /login ("Project Unavailable" with a Home link).
 *
 * Static segment beats the [slug] dynamic route, so "select" is reserved.
 * Lists projects the caller can actually reach: direct project_members
 * rows first, then org-membership projects. One project → straight
 * redirect, no interstitial.
 */
export default async function PortalSelectPage() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  type ProjectRow = { id: string; name: string | null; slug: string | null };

  // Direct grants — covers portal users whose persona lives on a project,
  // not an org membership.
  const { data: memberRows } = await supabase
    .from("project_members")
    .select("project:project_id(id, name, slug)")
    .eq("user_id", session.userId)
    .limit(100);
  const direct = ((memberRows ?? []) as Array<{ project: ProjectRow | null }>)
    .map((r) => r.project)
    .filter((p): p is ProjectRow => !!p);

  // Org-membership projects (RLS scopes to the caller's orgs).
  let orgProjects: ProjectRow[] = [];
  if (session.orgId) {
    const { data } = await supabase
      .from("projects")
      .select("id, name, slug")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .not("slug", "is", null)
      .order("updated_at", { ascending: false })
      .limit(100);
    orgProjects = (data ?? []) as ProjectRow[];
  }

  const byId = new Map<string, ProjectRow>();
  for (const p of [...direct, ...orgProjects]) {
    if (p.slug) byId.set(p.id, p);
  }
  const projects = [...byId.values()];

  // Exactly one reachable portal — skip the chooser entirely.
  if (projects.length === 1) redirect(`/p/${projects[0]!.slug}`);

  return (
    <main
      id="main"
      tabIndex={-1}
      className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-6 py-16"
    >
      <header className="space-y-1">
        <p className="eyebrow">
          {t("p.select.eyebrow", undefined, "Portal")}
        </p>
        <h1>{t("p.select.title", undefined, "Choose a Project")}</h1>
        <p className="text-sm text-[var(--p-text-2)]">
          {t("p.select.subtitle", undefined, "Pick the project portal you want to open.")}
        </p>
      </header>

      {projects.length === 0 ? (
        <EmptyState
          title={t("p.select.emptyTitle", undefined, "No Project Portals Yet")}
          description={t(
            "p.select.emptyDescription",
            undefined,
            "Your account isn't attached to a project portal yet. If you're expecting access, ask the team that invited you, or reach out and we'll get you sorted.",
          )}
          action={
            <a className="underline" href={`mailto:${BRAND.emails.support}`}>
              {t("p.select.contactSupport", undefined, "Contact Support")}
            </a>
          }
        />
      ) : (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/p/${p.slug}`}
                className="surface hover-lift flex items-center justify-between rounded-lg border border-[var(--p-border)] p-4"
              >
                <span className="font-medium">{p.name ?? p.slug}</span>
                <span className="font-mono text-xs text-[var(--p-text-2)]">/p/{p.slug}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
