export const dynamic = "force-dynamic";

import { getSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { fmtDate } from "@/components/detail/DetailShell";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { getSubmissionSchema } from "@/lib/advancing/submission-schemas";
import {
  applyRecipientDelivery,
  type AdvanceContact,
  type AdvancePacketSection,
  type AdvanceRequirement,
} from "@/lib/db/advance-packets";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { addSubmissionRowAction, submitSectionAction } from "./actions";
import { SubmissionRowForm } from "./SubmissionRowForm";

/**
 * The recipient onboarding packet (kit 27) — "email is the invite, the
 * portal is the packet". Token-scoped: `?t=<portal token>` resolves the
 * recipient through the service-role client (external counterparties have
 * no account). Org members without a token get a read-only preview of the
 * live packet via their RLS session instead.
 */

type SectionView = {
  section: AdvancePacketSection;
  requirement: AdvanceRequirement;
  dueAt: string | null;
  submission: { id: string; rows: Array<Record<string, unknown>>; submission_state: string } | null;
};

const REQ_VARIANT: Record<AdvanceRequirement, "success" | "info" | "muted"> = {
  required: "success",
  optional: "info",
  hidden: "muted",
};

export default async function PortalAdvancingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="page-content">{t("p.shared.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const { slug } = await params;
  const { t: token } = await searchParams;

  if (token && isServiceClientAvailable()) {
    const view = await resolveTokenView(slug, token);
    if (view) return <TokenPacket slug={slug} token={token} view={view} />;
  }

  // No (valid) token: org members preview the live packet; everyone else
  // needs their emailed link.
  const session = await getSession();
  if (session) {
    const project = await projectIdFromSlug(slug);
    if (project && project.org_id === session.orgId) {
      const supabase = await createClient();
      const { data: packet } = await supabase
        .from("advance_packets")
        .select("id, packet_state, version")
        .eq("org_id", session.orgId)
        .eq("project_id", project.id)
        .is("deleted_at", null)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (packet) {
        const { data: sections } = await supabase
          .from("advance_packet_sections")
          .select("id, title, section_key, submission_schema_key")
          .eq("packet_id", packet.id)
          .is("deleted_at", null)
          .order("sort_order", { ascending: true });
        return (
          <div className="page-content max-w-3xl space-y-5">
            <div>
              <p className="eyebrow">{t("p.advancing.previewEyebrow", undefined, "Operator Preview")}</p>
              <h1>{t("p.advancing.title", undefined, "Advance Packet")}</h1>
              <p className="ps-body mt-1 text-[var(--p-text-2)]">
                {t(
                  "p.advancing.previewNote",
                  undefined,
                  "Recipients see this packet scoped to their audience via their emailed link. This is the unscoped outline.",
                )}
              </p>
            </div>
            <ul className="surface divide-y divide-[var(--p-border)] p-0">
              {(sections ?? []).map((s) => (
                <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>{s.title}</span>
                  <span className="font-mono text-xs text-[var(--p-text-3)]">{s.submission_schema_key ?? "info"}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }
    }
  }

  return (
    <div className="page-content max-w-3xl">
      <EmptyState
        title={t("p.advancing.lockedTitle", undefined, "Your Advance Link Is Required")}
        description={t(
          "p.advancing.lockedDescription",
          undefined,
          "This packet opens from the personalized link in your advance email. Can't find it? Reply to the thread and the sending team will resend it.",
        )}
      />
    </div>
  );
}

type TokenView = {
  recipient: { id: string; contact: AdvanceContact; delivery_state: string; late_flagged_at: string | null };
  packet: { id: string; voice: string; support_contact: { name?: string; email?: string } };
  project: { name: string };
  audience: {
    company: string;
    team: string | null;
    scope: string | null;
    contract_id: string | null;
    external_scheduler_url: string | null;
  } | null;
  sections: SectionView[];
  schedulerHref: string | null;
};

async function resolveTokenView(slug: string, token: string): Promise<TokenView | null> {
  const svc = createServiceClient() as unknown as LooseSupabase;
  const { data: recipient } = (await svc
    .from("advance_send_recipients")
    .select(
      "id, org_id, audience_id, contact, delivery_state, late_flagged_at, advance_send_batches!inner(packet_id)",
    )
    .eq("portal_token", token)
    .is("deleted_at", null)
    .maybeSingle()) as {
    data: {
      id: string;
      org_id: string;
      audience_id: string | null;
      contact: AdvanceContact;
      delivery_state: string;
      late_flagged_at: string | null;
      advance_send_batches: { packet_id: string } | null;
    } | null;
  };
  if (!recipient?.advance_send_batches) return null;

  const { data: packet } = (await svc
    .from("advance_packets")
    .select("id, voice, support_contact, projects!inner(name, slug)")
    .eq("id", recipient.advance_send_batches.packet_id)
    .is("deleted_at", null)
    .maybeSingle()) as {
    data: {
      id: string;
      voice: string;
      support_contact: { name?: string; email?: string };
      projects: { name: string; slug: string };
    } | null;
  };
  // The slug in the URL must match the packet's project — a token minted
  // for one show must not render under another show's branding.
  if (!packet || packet.projects.slug !== slug) return null;

  const [{ data: audience }, { data: rawSections }, { data: rawSubmissions }] = (await Promise.all([
    recipient.audience_id
      ? svc
          .from("advance_audiences")
          .select("id, company, team, scope, contract_id, external_scheduler_url")
          .eq("id", recipient.audience_id)
          .is("deleted_at", null)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    svc
      .from("advance_packet_sections")
      .select("*")
      .eq("packet_id", packet.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true })
      .limit(100),
    svc
      .from("advance_submissions")
      .select("id, section_id, rows, submission_state")
      .eq("recipient_id", recipient.id)
      .is("deleted_at", null)
      .limit(200),
  ])) as [
    {
      data: {
        id: string;
        company: string;
        team: string | null;
        scope: string | null;
        contract_id: string | null;
        external_scheduler_url: string | null;
      } | null;
    },
    { data: AdvancePacketSection[] | null },
    { data: Array<{ id: string; section_id: string; rows: Array<Record<string, unknown>>; submission_state: string }> | null },
  ];

  // Scoping: with an audience, only its non-hidden assigned sections render;
  // with no assignments at all, the whole packet is visible (default-open).
  const sections = rawSections ?? [];
  let visible: Array<{ section: AdvancePacketSection; requirement: AdvanceRequirement; dueAt: string | null }> = [];
  if (audience) {
    const { data: assignments } = (await svc
      .from("advance_section_assignments")
      .select("section_id, requirement, due_at")
      .eq("audience_id", audience.id)
      .is("deleted_at", null)
      .limit(200)) as {
      data: Array<{ section_id: string; requirement: AdvanceRequirement; due_at: string | null }> | null;
    };
    const byId = new Map((assignments ?? []).map((a) => [a.section_id, a]));
    if (byId.size > 0) {
      visible = sections
        .filter((s) => {
          const a = byId.get(s.id);
          return a && a.requirement !== "hidden";
        })
        .map((s) => {
          const a = byId.get(s.id)!;
          return { section: s, requirement: a.requirement, dueAt: a.due_at };
        });
    }
  }
  if (visible.length === 0) {
    visible = sections.map((s) => ({ section: s, requirement: "optional" as AdvanceRequirement, dueAt: null }));
  }

  const submissionBySection = new Map((rawSubmissions ?? []).map((s) => [s.section_id, s]));

  // Bespoke scheduler (decision #2): the org's first active event type is
  // the default; the audience's external URL is the v1 fallback.
  let schedulerHref: string | null = audience?.external_scheduler_url ?? null;
  const { data: eventType } = (await svc
    .from("scheduler_event_types")
    .select("public_token")
    .eq("org_id", recipient.org_id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()) as { data: { public_token: string } | null };
  if (eventType) schedulerHref = `/book/${eventType.public_token}?r=${token}`;

  // First open advances the funnel (delivered → opened), forward-only.
  await applyRecipientDelivery(svc, recipient.id, "opened", { reason: "portal opened" });

  return {
    recipient: {
      id: recipient.id,
      contact: recipient.contact,
      delivery_state: recipient.delivery_state,
      late_flagged_at: recipient.late_flagged_at,
    },
    packet: { id: packet.id, voice: packet.voice, support_contact: packet.support_contact ?? {} },
    project: { name: packet.projects.name },
    audience,
    sections: visible.map((v) => ({
      ...v,
      submission: submissionBySection.get(v.section.id) ?? null,
    })),
    schedulerHref,
  };
}

async function TokenPacket({ slug, token, view }: { slug: string; token: string; view: TokenView }) {
  const { t } = await getRequestT();
  const required = view.sections.filter((s) => s.requirement === "required");
  const requiredDone = required.filter(
    (s) => s.submission && ["submitted", "accepted"].includes(s.submission.submission_state),
  ).length;

  return (
    <div className="page-content max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="eyebrow">
          {view.audience
            ? view.audience.team
              ? `${view.audience.team} · ${view.audience.company}`
              : view.audience.company
            : t("p.advancing.eyebrow", undefined, "Project Advance")}
        </p>
        <h1>{view.project.name}</h1>
        <p className="ps-body text-[var(--p-text-2)]">
          {t(
            "p.advancing.intro",
            undefined,
            "Everything your team needs to advance this show. Submit through the forms below. No copies, no attachments.",
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {view.audience?.contract_id && (
            <span className="ps-id font-mono text-xs">
              {t("p.advancing.contractId", undefined, "Contract ID")} · {view.audience.contract_id}
            </span>
          )}
          {view.audience?.scope && <Badge variant="muted">{view.audience.scope}</Badge>}
          {view.recipient.late_flagged_at && (
            <Badge variant="error">{t("p.advancing.lateFlag", undefined, "Past Deadline")}</Badge>
          )}
        </div>
        {required.length > 0 && (
          <div className="space-y-1">
            <ProgressBar value={Math.round((requiredDone / required.length) * 100)} />
            <p className="ps-caption text-[var(--p-text-2)]">
              {t(
                "p.advancing.progress",
                { done: requiredDone, total: required.length },
                `${requiredDone} of ${required.length} required sections submitted`,
              )}
            </p>
          </div>
        )}
      </header>

      {view.schedulerHref && (
        <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold">{t("p.advancing.sosTitle", undefined, "Schedule On Site")}</p>
            <p className="ps-caption text-[var(--p-text-2)]">
              {t("p.advancing.sosNote", undefined, "First time on site? Book an orientation call with the advance team.")}
            </p>
          </div>
          <a href={view.schedulerHref} className="ps-btn ps-btn--sm" target="_blank" rel="noopener noreferrer">
            {t("p.advancing.sosCta", undefined, "Book a Time")}
          </a>
        </div>
      )}

      {view.sections.map(({ section, requirement, dueAt, submission }) => {
        const schema = getSubmissionSchema(section.submission_schema_key);
        const body = (section.body as { text?: string } | null)?.text;
        const state = submission?.submission_state;
        return (
          <section key={section.id} className="surface space-y-3 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="me-auto">{section.title}</h2>
              <Badge variant={REQ_VARIANT[requirement]}>
                {requirement === "required"
                  ? t("p.advancing.required", undefined, "Required")
                  : t("p.advancing.optional", undefined, "Optional")}
              </Badge>
              {dueAt && (
                <span className="font-mono text-xs text-[var(--p-text-2)]">
                  {t("p.advancing.due", undefined, "Due")} · {fmtDate(dueAt)}
                </span>
              )}
              {state && (
                <Badge variant={state === "accepted" ? "success" : state === "returned" ? "warning" : "info"}>
                  {state}
                </Badge>
              )}
            </div>
            {body && <p className="ps-body text-[var(--p-text-2)]">{body}</p>}

            {schema && (
              <div className="space-y-3">
                {submission && submission.rows.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="ps-table w-full text-sm">
                      <thead>
                        <tr>
                          {schema.columns.map((c) => (
                            <th key={c.key}>{c.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {submission.rows.map((row, i) => (
                          <tr key={i}>
                            {schema.columns.map((c) => (
                              <td key={c.key} className="text-xs">
                                {row[c.key] != null ? String(row[c.key]) : "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {state !== "accepted" && (
                  <SubmissionRowForm
                    columns={[...schema.columns]}
                    action={addSubmissionRowAction.bind(null, slug, token, section.id)}
                  />
                )}
                {(state === "draft" || state === "returned") && (
                  <form action={submitSectionAction.bind(null, slug, token, section.id)}>
                    <button type="submit" className="ps-btn ps-btn--sm ps-btn--cta">
                      {t("p.advancing.submitSection", undefined, "Submit Section")}
                    </button>
                  </form>
                )}
                {state === "submitted" && (
                  <p className="ps-caption text-[var(--p-text-2)]">
                    {t(
                      "p.advancing.submittedNote",
                      undefined,
                      "Submitted. Need to add or change a line? New rows reopen the section for review.",
                    )}
                  </p>
                )}
              </div>
            )}
          </section>
        );
      })}

      <footer className="ps-caption text-[var(--p-text-3)]">
        {view.packet.support_contact?.name
          ? t(
              "p.advancing.support",
              { owner: view.packet.support_contact.name },
              `Questions? ${view.packet.support_contact.name} is your contact. Reply to the advance email.`,
            )
          : t("p.advancing.supportFallback", undefined, "Questions? Reply to the advance email and the team will see it.")}
      </footer>
    </div>
  );
}
