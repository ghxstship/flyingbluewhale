import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { toTitle } from "@/lib/format";
import { CATALOG_KINDS, CATALOG_KIND_LABEL_SINGULAR, listMyAssignments, type CatalogKind } from "@/lib/db/assignments";
import { FULFILLMENT_TONE } from "@/lib/tones";

export const dynamic = "force-dynamic";

/**
 * Portal `/p/[slug]/crew/advances` — production advancing for the caller
 * as an individual on this project. Unified system: tickets, credentials,
 * catering, radios, tools, equipment, uniforms, travel, lodging,
 * vehicles. Same `assignments` table read on /m/advances (cross-project)
 * and /studio/projects/.../advancing/assignments (admin authoring).
 */

export default async function CrewAdvancesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("p.crew.advances.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const { slug } = await params;
  const session = await requireSession();
  const fmt = await getRequestFormatters();

  const project = await projectIdFromSlug(slug);
  const rows = project ? await listMyAssignments(session.orgId, session.userId, { projectId: project.id }) : [];

  const byKind = new Map<CatalogKind, typeof rows>();
  for (const r of rows) {
    const list = byKind.get(r.catalog_kind) ?? [];
    list.push(r);
    byKind.set(r.catalog_kind, list);
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("p.crew.advances.eyebrow", undefined, "Portal")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("p.crew.advances.title", undefined, "My Assignments")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t(
          "p.crew.advances.subtitle",
          undefined,
          "Your tickets, credentials, catering, radios, tools, uniforms, travel, lodging, and vehicles for this show.",
        )}
      </p>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            size="compact"
            title={t("p.crew.advances.empty.title", undefined, "Nothing Assigned Yet")}
            description={t(
              "p.crew.advances.empty.description",
              undefined,
              "When your production team pins something to you, it lands here.",
            )}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {CATALOG_KINDS.filter((k) => byKind.has(k)).map((kind) => {
            const items = byKind.get(kind) ?? [];
            return (
              <section key={kind}>
                <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
                  {CATALOG_KIND_LABEL_SINGULAR[kind]} <span className="text-[var(--p-text-2)]">· {items.length}</span>
                </h2>
                <ul className="mt-2 space-y-2">
                  {items.map((d) => (
                    <li key={d.id} className="surface p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">
                            {d.title ?? t("p.crew.advances.item.untitled", undefined, "Untitled")}
                          </div>
                          <div className="mt-1 font-mono text-[10px] text-[var(--p-text-2)]">
                            v{d.version}
                            {d.deadline
                              ? ` · ${t("p.crew.advances.item.due", { date: fmt.date(d.deadline) }, `due ${fmt.date(d.deadline)}`)}`
                              : ""}
                            {d.issued_at
                              ? ` · ${t("p.crew.advances.item.issued", { date: fmt.date(d.issued_at) }, `issued ${fmt.date(d.issued_at)}`)}`
                              : ""}
                            {d.fulfilled_at ? ` · ${fmt.date(d.fulfilled_at)}` : ""}
                          </div>
                        </div>
                        <Badge variant={FULFILLMENT_TONE[d.fulfillment_state]}>{toTitle(d.fulfillment_state)}</Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-[var(--p-text-2)]">
        {t("p.crew.advances.footer.lead", undefined, "Issue with anything here? Reach your production coordinator via")}{" "}
        <Link className="underline" href={`/p/${slug}/crew`}>
          {t("p.crew.advances.footer.callSheet", undefined, "your call-sheet")}
        </Link>
        .
      </p>
    </div>
  );
}
