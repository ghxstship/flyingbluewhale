import { Button } from "@/components/ui/Button";
import { FileDown } from "lucide-react";
import { notFound } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getGuideByPersona } from "@/lib/db/guides";
import { GuideView } from "@/components/guides/GuideView";
import { GuideComments } from "@/components/guides/GuideComments";
import type { GuideConfig } from "@/lib/guides/types";
import type { GuidePersona, Persona } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

// Mobile guide reads `session.persona` directly so the granular
// marketplace personas (client → client guide, contractor → vendor
// guide, crew → crew guide) get the right tier. Bug #13 / Workstream A1.
function mapPersona(persona: Persona): GuidePersona {
  switch (persona) {
    case "owner":
    case "admin":
    case "manager":
    case "collaborator":
      return "staff";
    case "contractor":
      return "vendor";
    case "client":
      return "client";
    case "crew":
      return "crew";
    case "viewer":
    case "community":
    case "member":
    case "guest":
    case "visitor":
    default:
      return "guest";
  }
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
        <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Field Guide</div>
        <h1 className="mt-1 text-2xl font-semibold">No Active Project</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Check back when you&apos;re assigned to a show.</p>
      </div>
    );
  }

  const persona = mapPersona(session.persona);
  const guide = await getGuideByPersona(active.id, persona);

  if (!guide) {
    return (
      <div className="px-4 pt-6 pb-24">
        <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">{active.name}</div>
        <h1 className="mt-1 text-2xl font-semibold">Guide Pending</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Production hasn&apos;t published a guide for your role yet.
        </p>
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
      <div className="mb-4 flex justify-end">
        <Button
          href={`/api/v1/guides/${guide.id}/pdf`}
          variant="ghost"
          size="sm"
          className="inline-flex items-center gap-1.5"
          aria-label="Download this guide as a PDF"
        >
          <FileDown size={14} aria-hidden="true" />
          Download PDF
        </Button>
      </div>
      <GuideView
        title={guide.title}
        subtitle={guide.subtitle}
        classification={guide.classification}
        tier={guide.tier}
        updatedAt={guide.updated_at}
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
