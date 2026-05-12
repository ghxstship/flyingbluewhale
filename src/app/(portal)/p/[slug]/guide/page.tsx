import Link from "next/link";
import { FileDown } from "lucide-react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { hasSupabase } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getGuideByPersona, PERSONA_TIERS } from "@/lib/db/guides";
import { GuideView } from "@/components/guides/GuideView";
import { GuideComments } from "@/components/guides/GuideComments";
import { createClient } from "@/lib/supabase/server";
import type { GuideConfig } from "@/lib/guides/types";
import type { GuidePersona, Persona } from "@/lib/supabase/types";
import {
  cookieName as guideCookieName,
  isPublicPersona,
  verifyToken as verifyGuideAccessToken,
} from "@/lib/guides/access-token";

export const dynamic = "force-dynamic";

// Map session persona → guide persona for the portal viewer. Bug #13 /
// Workstream A1 — was previously role-based (owner/admin/manager → staff,
// everyone else → crew), which collapsed every marketplace persona into
// one guide tier. Now uses the granular session.persona so client sees
// the client guide, contractor sees the vendor guide, crew sees crew,
// etc.
function mapSessionToGuidePersona(persona: Persona): GuidePersona {
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

const VALID_PERSONAS = new Set<GuidePersona>([
  "staff",
  "crew",
  "vendor",
  "brand_ambassador",
  "sponsor",
  "artist",
  "media_press",
  "client",
  "guest",
  "custom",
]);

export default async function GuidePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const session = await getSession();
  const isOrgMemberOfProject = !!session && session.orgId === project.org_id;
  const sessionPersona: GuidePersona = session ? mapSessionToGuidePersona(session.persona) : "guest";
  // No dev-mode bypass: when there's no session the viewer IS the guest
  // tier, exactly like production. The previous bypass quietly upgraded
  // dev anon viewers to "staff" which broke the
  // handoff-shells.spec § "anon sees published guest guide" test —
  // semantic correctness > dev convenience. Devs who want to see other
  // tiers can `?as=<persona>` (gated below) or log in with a fixture user.

  // Read the per-project access cookie up front. If present + valid, the
  // bearer has redeemed one or more codes and can view those personas
  // without auth.
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(guideCookieName(project.id))?.value ?? null;
  const verified = await verifyGuideAccessToken(accessToken, project.id);
  const unlockedPersonas = new Set<GuidePersona>(verified?.personas ?? []);

  // Effective default persona priority:
  //   1. Live session → role-mapped persona.
  //   2. Code-only viewer → highest-permission unlocked persona.
  //   3. Anon visitor → guest.
  function highestUnlocked(): GuidePersona | null {
    let best: GuidePersona | null = null;
    let bestTier = Infinity;
    for (const p of unlockedPersonas) {
      const t = PERSONA_TIERS[p].tier;
      if (t < bestTier) {
        bestTier = t;
        best = p;
      }
    }
    return best;
  }
  const effectivePersona: GuidePersona = session ? sessionPersona : (highestUnlocked() ?? "guest");
  const sessionTier = PERSONA_TIERS[effectivePersona].tier;

  // ?as=<persona> preview override. Two paths grant the switch:
  //   1. Org session / dev mode — gated by tier hierarchy (lower number =
  //      higher permission, can view equal-or-lower tier).
  //   2. Redeemed access code — bearer can switch to any persona they've
  //      unlocked, plus the public-tier personas (guest, custom).
  const asParam = typeof sp.as === "string" ? sp.as : undefined;
  const asPersona: GuidePersona | null =
    !!asParam && VALID_PERSONAS.has(asParam as GuidePersona) ? (asParam as GuidePersona) : null;
  const asViaSession = !!session && !!asPersona && PERSONA_TIERS[asPersona].tier >= sessionTier;
  const asViaCode = !!asPersona && (unlockedPersonas.has(asPersona) || isPublicPersona(asPersona));
  const asPersonaAllowed = asViaSession || asViaCode;
  const previewing = asPersonaAllowed && asPersona !== effectivePersona;
  const persona: GuidePersona = previewing ? (asPersona as GuidePersona) : effectivePersona;

  // Access gate: public personas are always allowed (published-guide RLS
  // still enforces visibility). Internal personas require either an org
  // session for this project or a redeemed code unlocking this persona.
  //
  // Two redirect triggers, both end up on the unlock page:
  //   1. The *resolved* persona is internal but not entitled — usually
  //      means an org-session viewer's session lapsed.
  //   2. The user explicitly asked via ?as=<internal-persona> and isn't
  //      entitled. We send them to unlock instead of silently falling
  //      back to guest, otherwise the "click my staff link" UX feels
  //      broken ("I clicked a Production link but landed on Guests").
  const resolvedNeedsCode = !isPublicPersona(persona) && !isOrgMemberOfProject && !unlockedPersonas.has(persona);
  const askedNeedsCode =
    !!asPersona && !isPublicPersona(asPersona) && !isOrgMemberOfProject && !unlockedPersonas.has(asPersona);
  if (resolvedNeedsCode || askedNeedsCode) {
    const targetPersona = askedNeedsCode ? (asPersona as GuidePersona) : persona;
    const from = `/p/${slug}/guide?as=${targetPersona}`;
    redirect(`/p/${slug}/guide/unlock?as=${targetPersona}&from=${encodeURIComponent(from)}`);
  }

  const guide = await getGuideByPersona(project.id, persona);

  if (!guide || !guide.published) {
    return (
      <>
        <ModuleHeader eyebrow={project.name} title="Event Guide" subtitle="Your Know-Before-You-Go" />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--text-muted)]">
            The production team hasn&apos;t published a guide for your role yet. Check back soon.
          </div>
        </div>
      </>
    );
  }

  // Initial comments (server-fetched for first paint)
  const supabase = await createClient();
  const { data: initialComments } = await supabase
    .from("guide_comments")
    .select("id, body, author_name, created_at, resolved_at")
    .eq("guide_id", guide.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={guide.title}
        subtitle={guide.subtitle ?? undefined}
        action={
          <Link
            href={`/api/v1/guides/${guide.id}/pdf`}
            className="btn btn-ghost btn-sm inline-flex items-center gap-1.5"
            aria-label="Download this guide as a PDF"
          >
            <FileDown size={14} aria-hidden="true" />
            Download PDF
          </Link>
        }
      />
      <div className="page-content max-w-4xl">
        {(session || unlockedPersonas.size > 0) && (
          <PreviewSwitcher
            slug={slug}
            active={persona}
            previewing={previewing}
            sessionTier={session ? sessionTier : 99}
            unlockedPersonas={Array.from(unlockedPersonas)}
            hasOrgSession={!!session}
          />
        )}
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
    </>
  );
}

// 8 counted personas (1–8) followed by Temporary Access (uncounted, parallel).
// Ordered by tier (1 → 5) and within tier by floor-presence.
const PREVIEW_PERSONAS: { value: GuidePersona; label: string }[] = [
  { value: "staff", label: "Production" }, // 1
  { value: "crew", label: "Operations" }, // 2
  { value: "vendor", label: "Food & Beverage" }, // 3
  { value: "brand_ambassador", label: "Brand Ambassador" }, // 4
  { value: "sponsor", label: "Sponsors" }, // 5
  { value: "artist", label: "Talent" }, // 6
  { value: "media_press", label: "Media & Press" }, // 7
  { value: "guest", label: "Guests" }, // 8
  { value: "custom", label: "Temporary Access" }, // (parallel, uncounted)
];

function PreviewSwitcher({
  slug,
  active,
  previewing,
  sessionTier,
  unlockedPersonas,
  hasOrgSession,
}: {
  slug: string;
  active: GuidePersona;
  previewing: boolean;
  sessionTier: number;
  unlockedPersonas: GuidePersona[];
  hasOrgSession: boolean;
}) {
  // Visibility rules:
  //   - Org session / dev: anything at or below caller's permission tier.
  //   - Code-only viewer (no session): only personas they've unlocked, plus
  //     the public-tier personas (guest, custom) which are always visible.
  const unlockedSet = new Set(unlockedPersonas);
  const visible = PREVIEW_PERSONAS.filter((p) => {
    if (hasOrgSession) return PERSONA_TIERS[p.value].tier >= sessionTier;
    return unlockedSet.has(p.value) || p.value === "guest" || p.value === "custom";
  });
  if (visible.length < 2) return null;
  return (
    <div className="surface mb-4 flex flex-wrap items-center gap-2 px-4 py-2.5 text-xs">
      <span className="font-medium text-[var(--text-secondary)]">{previewing ? "Previewing as" : "Preview as"}</span>
      {visible.map((p) => {
        const isActive = p.value === active;
        return (
          <Link
            key={p.value}
            href={`/p/${slug}/guide?as=${p.value}`}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "rounded-full bg-[var(--org-primary)] px-2.5 py-1 font-medium text-[var(--background)]"
                : "rounded-full bg-[var(--surface-inset)] px-2.5 py-1 text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
            }
          >
            {p.label}
          </Link>
        );
      })}
      {previewing && (
        <Link href={`/p/${slug}/guide`} className="ml-auto text-[var(--text-muted)] underline-offset-2 hover:underline">
          Exit preview
        </Link>
      )}
    </div>
  );
}
