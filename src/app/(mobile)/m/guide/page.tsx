import Link from "next/link";
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
import { getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();

  // Pick the most recent active project for this user
  const supabase = await createClient();
  const { data: active } = await supabase
    .from("projects")
    .select("id,name,slug")
    .eq("org_id", session.orgId)
    .eq("project_state", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!active) {
    return (
      <div className="px-4 pt-6 pb-24">
        <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
          {t("m.guide.eyebrow", undefined, "Field Guide")}
        </div>
        <h1 className="mt-1 text-2xl font-semibold">
          {t("m.guide.noActiveProject.title", undefined, "No Active Project")}
        </h1>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">
          {t("m.guide.noActiveProject.body", undefined, "Check back when you're assigned to a show.")}
        </p>
      </div>
    );
  }

  const persona = mapPersona(session.persona);
  const guide = await getGuideByPersona(active.id, persona);

  if (!guide) {
    return (
      <div className="px-4 pt-6 pb-24">
        <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">{active.name}</div>
        <h1 className="mt-1 text-2xl font-semibold">{t("m.guide.pending.title", undefined, "Guide Pending")}</h1>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">
          {t("m.guide.pending.body", undefined, "Production hasn't published a guide for your role yet.")}
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
        <Link
          href={`/api/v1/guides/${guide.id}/pdf`}
          className="ps-btn ps-btn--ghost ps-btn--sm inline-flex items-center gap-1.5"
          aria-label={t("m.guide.downloadPdf.ariaLabel", undefined, "Download this guide as a PDF")}
        >
          <FileDown size={14} aria-hidden="true" />
          {t("m.guide.downloadPdf.label", undefined, "Download PDF")}
        </Link>
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
