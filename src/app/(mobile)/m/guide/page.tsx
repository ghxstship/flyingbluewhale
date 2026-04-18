import { notFound } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { requireSession, personaForRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getGuideByPersona } from "@/lib/db/guides";
import { GuideView } from "@/components/guides/GuideView";
import { GuideComments } from "@/components/guides/GuideComments";
import type { GuideConfig } from "@/lib/guides/types";
import type { GuidePersona } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function mapPersona(role: string): GuidePersona {
  const persona = personaForRole(role as Parameters<typeof personaForRole>[0]);
  if (persona === "artist" || persona === "vendor" || persona === "client" || persona === "sponsor" || persona === "guest" || persona === "crew") return persona;
  if (persona === "owner" || persona === "admin" || persona === "controller" || persona === "project_manager" || persona === "developer") return "staff";
  return "guest";
}

export default async function MobileGuide() {
  if (!hasSupabase) notFound();
  const session = await requireSession();

  // Pick the most recent active project for this user
  const supabase = await createClient();
  const { data: active } = await supabase
    .from("projects")
    .select("id,name,slug")
    .eq("org_id", session.orgId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!active) {
    return (
      <div className="px-4 pt-6 pb-24">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Field guide</div>
        <h1 className="mt-1 text-2xl font-semibold">No active project</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Check back when you&apos;re assigned to a show.</p>
      </div>
    );
  }

  const persona = mapPersona(session.role);
  const guide = await getGuideByPersona(active.id, persona);

  if (!guide) {
    return (
      <div className="px-4 pt-6 pb-24">
        <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">{active.name}</div>
        <h1 className="mt-1 text-2xl font-semibold">Guide pending</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Production hasn&apos;t published a guide for your role yet.</p>
      </div>
    );
  }

  const { data: initialComments } = await supabase
    .from("guide_comments")
    .select("id, body, author_name, created_at, resolved_at")
    .eq("guide_id", guide.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="px-4 pt-6 pb-24">
      <GuideView
        title={guide.title}
        subtitle={guide.subtitle}
        classification={guide.classification}
        tier={guide.tier}
        config={guide.config as GuideConfig}
        comments={
          <GuideComments
            guideId={guide.id}
            orgId={guide.org_id}
            initial={(initialComments ?? []) as Parameters<typeof GuideComments>[0]["initial"]}
          />
        }
      />
    </div>
  );
}
