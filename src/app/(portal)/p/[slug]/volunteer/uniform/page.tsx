import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Member = {
  id: string;
  full_name: string;
  metadata: unknown;
};

type Sizing = {
  size_top?: string;
  size_bottom?: string;
  size_shoes?: string;
  pickup_slot?: string;
  pickup_status?: string;
  notes?: string;
};

function metaToSizing(raw: unknown): Sizing {
  if (!raw || typeof raw !== "object") return {};
  const m = raw as Record<string, unknown>;
  return {
    size_top: typeof m.size_top === "string" ? m.size_top : undefined,
    size_bottom: typeof m.size_bottom === "string" ? m.size_bottom : undefined,
    size_shoes: typeof m.size_shoes === "string" ? m.size_shoes : undefined,
    pickup_slot: typeof m.pickup_slot === "string" ? m.pickup_slot : undefined,
    pickup_status: typeof m.pickup_status === "string" ? m.pickup_status : undefined,
    notes: typeof m.notes === "string" ? m.notes : undefined,
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.volunteer.uniform.eyebrowShort", undefined, "Portal")}
          title={t("p.volunteer.uniform.title", undefined, "Uniform")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.volunteer.uniform.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("crew_members")
    .select("id, full_name:name, metadata")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .maybeSingle();

  const member = data as Member | null;
  const sizing = metaToSizing(member?.metadata);
  const ready = Boolean(sizing.size_top && sizing.size_bottom);

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.volunteer.uniform.eyebrow", undefined, "Portal · Volunteer")}
        title={t("p.volunteer.uniform.title", undefined, "Uniform")}
        subtitle={
          member
            ? t("p.volunteer.uniform.subtitle", { name: member.full_name }, `Issue tracking for ${member.full_name}`)
            : t("p.volunteer.uniform.signInRequired", undefined, "Sign-in required")
        }
        breadcrumbs={[
          { label: t("p.volunteer.uniform.crumbPortal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.volunteer.uniform.crumbVolunteer", undefined, "Volunteer"), href: `/p/${slug}/volunteer` },
          { label: t("p.volunteer.uniform.crumbUniform", undefined, "Uniform") },
        ]}
        action={
          <Badge variant={sizing.pickup_status === "collected" ? "success" : ready ? "info" : "warning"}>
            {sizing.pickup_status ??
              (ready
                ? t("p.volunteer.uniform.badge.ready", undefined, "ready")
                : t("p.volunteer.uniform.badge.sizesNeeded", undefined, "sizes needed"))}
          </Badge>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.volunteer.uniform.metric.sizingOnFile", undefined, "Sizing on file")}
            value={
              ready
                ? t("p.volunteer.uniform.metric.yes", undefined, "Yes")
                : t("p.volunteer.uniform.metric.no", undefined, "No")
            }
            accent={ready}
          />
          <MetricCard
            label={t("p.volunteer.uniform.metric.pickupSlot", undefined, "Pickup slot")}
            value={sizing.pickup_slot ?? t("p.volunteer.uniform.metric.tbd", undefined, "TBD")}
          />
          <MetricCard
            label={t("p.volunteer.uniform.metric.status", undefined, "Status")}
            value={sizing.pickup_status ?? t("p.volunteer.uniform.metric.pending", undefined, "pending")}
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("p.volunteer.uniform.sizing.heading", undefined, "Your Sizing")}</h3>
          {!member ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "p.volunteer.uniform.sizing.applyFirst",
                undefined,
                "Submit your volunteer application first. Sizing data lives on your workforce profile.",
              )}
            </p>
          ) : (
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--p-text-2)]">{t("p.volunteer.uniform.sizing.top", undefined, "Top")}</dt>
              <dd>{sizing.size_top ?? "—"}</dd>
              <dt className="text-[var(--p-text-2)]">{t("p.volunteer.uniform.sizing.bottom", undefined, "Bottom")}</dt>
              <dd>{sizing.size_bottom ?? "—"}</dd>
              <dt className="text-[var(--p-text-2)]">{t("p.volunteer.uniform.sizing.shoes", undefined, "Shoes")}</dt>
              <dd>{sizing.size_shoes ?? "—"}</dd>
              <dt className="text-[var(--p-text-2)]">{t("p.volunteer.uniform.sizing.notes", undefined, "Notes")}</dt>
              <dd className="text-xs">{sizing.notes ?? "—"}</dd>
            </dl>
          )}
        </section>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("p.volunteer.uniform.pickup.heading", undefined, "Pickup")}</h3>
          <p className="mt-2 text-xs text-[var(--p-text-2)]">
            {t(
              "p.volunteer.uniform.pickup.instructions",
              undefined,
              "Pickup happens at the Workforce Centre. Bring your ID and accreditation. Allow 30 minutes for fitting and collection.",
            )}
          </p>
          {sizing.pickup_slot ? (
            <p className="mt-3 font-mono text-sm">
              {t("p.volunteer.uniform.pickup.slotLabel", undefined, "Slot:")} <strong>{sizing.pickup_slot}</strong>
            </p>
          ) : (
            <p className="mt-3 text-xs text-[var(--p-text-2)]">
              {t(
                "p.volunteer.uniform.pickup.notBooked",
                undefined,
                "Slot not yet booked. Your team lead will assign one based on your shift schedule.",
              )}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
