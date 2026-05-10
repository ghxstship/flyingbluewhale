import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { updateSitePlan } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "input-base focus-ring";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

const DISCIPLINES = [
  "site",
  "rigging",
  "power",
  "audio",
  "video",
  "lighting",
  "comms",
  "evacuation",
  "hospitality",
  "accessibility",
  "sustainability",
  "other",
] as const;

type SitePlan = {
  id: string;
  code: string;
  title: string;
  discipline: (typeof DISCIPLINES)[number];
  project_id: string | null;
  venue_id: string | null;
  notes: string | null;
  updated_at: string;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data }, { data: projects }, { data: venues }] = await Promise.all([
    supabase
      .from("site_plans")
      .select("id, code, title, discipline, project_id, venue_id, notes, updated_at")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("venues").select("id, name").eq("org_id", session.orgId).order("name"),
  ]);

  const sp = data as unknown as SitePlan | null;
  if (!sp) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title={`Edit Site Plan · ${sp.code}`}
        subtitle="Update code, title, discipline, project/venue assignment, and notes."
        breadcrumbs={[
          { label: "Site Plans", href: "/console/site-plans" },
          { label: sp.code, href: `/console/site-plans/${sp.id}` },
          { label: "Edit" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateSitePlan}
          cancelHref={`/console/site-plans/${sp.id}`}
          submitLabel="Save Site Plan"
          dirtyGuard
        >
          {/* Sea Trial FINDING-022: optimistic concurrency token. */}
          <input type="hidden" name="_updated_at" defaultValue={sp.updated_at} />
          <input type="hidden" name="id" value={sp.id} />

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Code<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input name="code" required defaultValue={sp.code} maxLength={40} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Discipline</span>
              <select name="discipline" required defaultValue={sp.discipline} className={INPUT}>
                {DISCIPLINES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Title<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="title" required defaultValue={sp.title} maxLength={200} className={INPUT} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Project</span>
              <select name="project_id" defaultValue={sp.project_id ?? ""} className={INPUT}>
                <option value="">—</option>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Venue</span>
              <select name="venue_id" defaultValue={sp.venue_id ?? ""} className={INPUT}>
                <option value="">—</option>
                {(venues ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Notes</span>
            <textarea name="notes" rows={4} defaultValue={sp.notes ?? ""} maxLength={2000} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
