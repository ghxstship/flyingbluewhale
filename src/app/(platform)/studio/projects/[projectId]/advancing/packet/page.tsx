export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button, buttonVariants } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { fmtDate } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";
import { RouteTabs } from "@/components/ui/RouteTabs";
import {
  getProjectPacket,
  listPacketSections,
  listPacketAudiences,
  listSectionAssignments,
  ADVANCE_SECTION_KEYS,
  ADVANCE_SECTION_LABEL,
  ADVANCE_VOICES,
  NEXT_PACKET_STATES,
} from "@/lib/db/advance-packets";
import { SUBMISSION_SCHEMAS, SUBMISSION_SCHEMA_KEYS } from "@/lib/advancing/submission-schemas";
import {
  createPacketAction,
  setPacketVoiceAction,
  transitionPacketAction,
  addSectionAction,
  deleteSectionAction,
  addAudienceAction,
  deleteAudienceAction,
  assignSectionAction,
  removeAssignmentAction,
} from "./actions";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .eq("id", projectId)
    .maybeSingle();

  const packet = await getProjectPacket(session.orgId, projectId);
  const [sections, audiences] = packet
    ? await Promise.all([listPacketSections(packet.id), listPacketAudiences(packet.id)])
    : [[], []];
  const assignments = packet ? await listSectionAssignments(audiences.map((a) => a.id)) : [];
  const assignmentByPair = new Map(assignments.map((a) => [`${a.audience_id}:${a.section_id}`, a]));

  // Preset audience types available to seed from (org + project matrices).
  const [{ data: orgPresetTypes }, { data: projectPresetTypes }] = await Promise.all([
    supabase.from("org_advance_presets").select("audience_type").eq("org_id", session.orgId).is("deleted_at", null),
    supabase
      .from("project_advance_presets")
      .select("audience_type")
      .eq("project_id", projectId)
      .is("deleted_at", null),
  ]);
  const presetTypes = Array.from(
    new Set(
      [...(orgPresetTypes ?? []), ...(projectPresetTypes ?? [])].map(
        (r) => (r as { audience_type: string }).audience_type,
      ),
    ),
  ).sort();

  const tabs = (
    <RouteTabs
      tabs={[
        {
          label: t("console.projects.advancing.tabs.docSpecs", undefined, "Doc Specs"),
          href: `/studio/projects/${projectId}/advancing`,
        },
        {
          label: t("console.projects.advancing.tabs.assignments", undefined, "Assignments"),
          href: `/studio/projects/${projectId}/advancing/assignments`,
        },
        {
          label: t("console.projects.advancing.tabs.packet", undefined, "Packet"),
          href: `/studio/projects/${projectId}/advancing/packet`,
        },
      ]}
      className="border-b border-[var(--p-border)]"
    />
  );

  const header = (
    <ModuleHeader
      eyebrow={project?.name ?? t("console.projects.advancing.eyebrowFallback", undefined, "Project")}
      title={t("console.projects.advancing.packet.title", undefined, "Advance Packet")}
      subtitle={t(
        "console.projects.advancing.packet.subtitle",
        undefined,
        "One packet, many views. Sections scoped per audience, authored once.",
      )}
      breadcrumbs={[
        { label: t("console.projects.advancing.breadcrumbs.projects", undefined, "Projects"), href: "/studio/projects" },
        {
          label: project?.name ?? t("console.projects.advancing.eyebrowFallback", undefined, "Project"),
          href: `/studio/projects/${projectId}`,
        },
        {
          label: t("console.projects.advancing.breadcrumbs.advancing", undefined, "Advancing"),
          href: `/studio/projects/${projectId}/advancing`,
        },
        { label: t("console.projects.advancing.packet.breadcrumb", undefined, "Packet") },
      ]}
      action={
        <Button href="/studio/comms/advances" size="sm" variant="secondary">
          {t("console.projects.advancing.packet.mergeConsole", undefined, "Merge Console →")}
        </Button>
      }
    />
  );

  if (!packet) {
    return (
      <>
        {header}
        <div className="page-content max-w-6xl space-y-5">
          {tabs}
          <EmptyState
            title={t("console.projects.advancing.packet.empty.title", undefined, "No Packet Yet")}
            description={t(
              "console.projects.advancing.packet.empty.description",
              undefined,
              "Create the project onboarding packet: overview, schedule, worksheets, and scheduling, scoped per audience by the section matrix.",
            )}
            action={
              <form action={createPacketAction.bind(null, projectId)}>
                <Button type="submit" size="sm">
                  {t("console.projects.advancing.packet.empty.cta", undefined, "Create Packet")}
                </Button>
              </form>
            }
          />
        </div>
      </>
    );
  }

  const nextStates = NEXT_PACKET_STATES[packet.packet_state];

  return (
    <>
      {header}
      <div className="page-content max-w-6xl space-y-5">
        {tabs}

        {/* Packet header: state, version, voice */}
        <div className="surface flex flex-wrap items-center gap-4 p-6">
          <StatusBadge status={packet.packet_state} />
          <span className="ps-id font-mono text-xs">
            {t("console.projects.advancing.packet.version", { version: packet.version }, `v${packet.version}`)}
          </span>
          <form action={setPacketVoiceAction.bind(null, projectId)} className="flex items-center gap-2">
            <input type="hidden" name="packet_id" value={packet.id} />
            <label className="text-xs text-[var(--p-text-2)]" htmlFor="packet-voice">
              {t("console.projects.advancing.packet.voice", undefined, "Voice")}
            </label>
            <select id="packet-voice" name="voice" defaultValue={packet.voice} className="ps-input ps-input--sm">
              {ADVANCE_VOICES.map((v) => (
                <option key={v} value={v}>
                  {v === "neutral"
                    ? t("console.projects.advancing.packet.voiceNeutral", undefined, "Neutral")
                    : t("console.projects.advancing.packet.voiceFlair", undefined, "Flair")}
                </option>
              ))}
            </select>
            <button type="submit" className="ps-btn ps-btn--sm">
              {t("common.save", undefined, "Save")}
            </button>
          </form>
          <div className="ms-auto flex items-center gap-2">
            {nextStates.map((to) => (
              <form key={to} action={transitionPacketAction.bind(null, projectId)}>
                <input type="hidden" name="packet_id" value={packet.id} />
                <input type="hidden" name="from" value={packet.packet_state} />
                <input type="hidden" name="to" value={to} />
                <button type="submit" className={to === "live" ? "ps-btn ps-btn--sm ps-btn--cta" : "ps-btn ps-btn--sm"}>
                  {to === "live"
                    ? t("console.projects.advancing.packet.goLive", undefined, "Go Live")
                    : to === "archived"
                      ? t("console.projects.advancing.packet.archive", undefined, "Archive")
                      : t("console.projects.advancing.packet.backToDraft", undefined, "Back to Draft")}
                </button>
              </form>
            ))}
          </div>
        </div>

        {/* Sections */}
        <section className="space-y-3">
          <h3>{t("console.projects.advancing.packet.sections.heading", undefined, "Sections")}</h3>
          {sections.length === 0 ? (
            <EmptyState
              title={t("console.projects.advancing.packet.sections.empty", undefined, "No Sections")}
              description={t(
                "console.projects.advancing.packet.sections.emptyDescription",
                undefined,
                "Add the blocks recipients will see: overview, worksheets, safety, parking.",
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th>{t("console.projects.advancing.packet.sections.columns.title", undefined, "Title")}</th>
                    <th>{t("console.projects.advancing.packet.sections.columns.key", undefined, "Key")}</th>
                    <th>{t("console.projects.advancing.packet.sections.columns.schema", undefined, "Submission Schema")}</th>
                    <th>{t("console.projects.advancing.packet.sections.columns.docs", undefined, "Doc Types")}</th>
                    <th className="text-end">
                      {t("console.projects.advancing.packet.sections.columns.actions", undefined, "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((s) => (
                    <tr key={s.id}>
                      <td>{s.title}</td>
                      <td className="font-mono text-xs">{s.section_key}</td>
                      <td className="font-mono text-xs">{s.submission_schema_key ?? "—"}</td>
                      <td className="font-mono text-xs">
                        {s.deliverable_types.length > 0 ? s.deliverable_types.join(", ") : "—"}
                      </td>
                      <td className="text-end">
                        <form action={deleteSectionAction.bind(null, projectId)} className="inline">
                          <input type="hidden" name="section_id" value={s.id} />
                          <button type="submit" className="ps-btn ps-btn--sm">
                            {t("common.remove", undefined, "Remove")}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <details className="surface p-6">
            <summary className="cursor-pointer text-sm font-semibold">
              {t("console.projects.advancing.packet.sections.add", undefined, "Add Section")}
            </summary>
            <div className="pt-4">
              <FormShell
                action={addSectionAction.bind(null, projectId)}
                submitLabel={t("console.projects.advancing.packet.sections.addSubmit", undefined, "Add Section")}
                dirtyGuard={false}
              >
                <input type="hidden" name="packet_id" value={packet.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                      {t("console.projects.advancing.packet.sections.kind", undefined, "Kind")}
                    </span>
                    <select name="section_key" className="ps-input" defaultValue="custom">
                      {ADVANCE_SECTION_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {ADVANCE_SECTION_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input
                    name="title"
                    label={t("console.projects.advancing.packet.sections.titleLabel", undefined, "Title")}
                    required
                  />
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                      {t("console.projects.advancing.packet.sections.schemaLabel", undefined, "Submission Schema")}
                    </span>
                    <select name="submission_schema_key" className="ps-input" defaultValue="">
                      <option value="">
                        {t("console.projects.advancing.packet.sections.schemaNone", undefined, "None (informational)")}
                      </option>
                      {SUBMISSION_SCHEMA_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {SUBMISSION_SCHEMAS[k].label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input
                    name="body_text"
                    label={t("console.projects.advancing.packet.sections.bodyLabel", undefined, "Body Copy")}
                  />
                </div>
              </FormShell>
            </div>
          </details>
        </section>

        {/* Audiences */}
        <section className="space-y-3">
          <h3>{t("console.projects.advancing.packet.audiences.heading", undefined, "Audiences")}</h3>
          {audiences.length === 0 ? (
            <EmptyState
              title={t("console.projects.advancing.packet.audiences.empty", undefined, "No Audiences Yet")}
              description={t(
                "console.projects.advancing.packet.audiences.emptyDescription",
                undefined,
                "A counterparty group per send: company, department, team, role, and scope, joined to the contract via the Job ID.",
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th>{t("console.projects.advancing.packet.audiences.columns.company", undefined, "Company")}</th>
                    <th>{t("console.projects.advancing.packet.audiences.columns.team", undefined, "Team")}</th>
                    <th>{t("console.projects.advancing.packet.audiences.columns.scope", undefined, "Scope")}</th>
                    <th>{t("console.projects.advancing.packet.audiences.columns.contractId", undefined, "Contract ID")}</th>
                    <th>{t("console.projects.advancing.packet.audiences.columns.contacts", undefined, "Contacts")}</th>
                    <th className="text-end">
                      {t("console.projects.advancing.packet.audiences.columns.actions", undefined, "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {audiences.map((a) => (
                    <tr key={a.id}>
                      <td>{a.company}</td>
                      <td>{a.team ?? "—"}</td>
                      <td className="font-mono text-xs">{a.scope ?? "—"}</td>
                      <td className="font-mono text-xs">{a.contract_id ?? "—"}</td>
                      <td className="font-mono text-xs">{a.contacts.length}</td>
                      <td className="text-end">
                        <form action={deleteAudienceAction.bind(null, projectId)} className="inline">
                          <input type="hidden" name="audience_id" value={a.id} />
                          <button type="submit" className="ps-btn ps-btn--sm">
                            {t("common.remove", undefined, "Remove")}
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <details className="surface p-6">
            <summary className="cursor-pointer text-sm font-semibold">
              {t("console.projects.advancing.packet.audiences.add", undefined, "Add Audience")}
            </summary>
            <div className="pt-4">
              <FormShell
                action={addAudienceAction.bind(null, projectId)}
                submitLabel={t("console.projects.advancing.packet.audiences.addSubmit", undefined, "Add Audience")}
                dirtyGuard={false}
              >
                <input type="hidden" name="packet_id" value={packet.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    name="company"
                    label={t("console.projects.advancing.packet.audiences.company", undefined, "Company")}
                    required
                  />
                  <Input
                    name="department"
                    label={t("console.projects.advancing.packet.audiences.department", undefined, "Department")}
                  />
                  <Input name="team" label={t("console.projects.advancing.packet.audiences.team", undefined, "Team")} />
                  <Input name="role" label={t("console.projects.advancing.packet.audiences.role", undefined, "Role")} />
                  <Input
                    name="scope"
                    label={t("console.projects.advancing.packet.audiences.scope", undefined, "Scope")}
                    hint={t(
                      "console.projects.advancing.packet.audiences.scopeHint",
                      undefined,
                      "The CMR scope grammar: load-in wk4, show days, load-out.",
                    )}
                  />
                  <Input
                    name="external_scheduler_url"
                    label={t(
                      "console.projects.advancing.packet.audiences.schedulerUrl",
                      undefined,
                      "External Scheduler URL",
                    )}
                    hint={t(
                      "console.projects.advancing.packet.audiences.schedulerUrlHint",
                      undefined,
                      "Optional v1 fallback; the bespoke scheduler is the default once live.",
                    )}
                  />
                  {presetTypes.length > 0 && (
                    <label className="block text-sm">
                      <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                        {t("console.projects.advancing.packet.audiences.preset", undefined, "Seed From Preset")}
                      </span>
                      <select name="preset_type" className="ps-input" defaultValue="">
                        <option value="">
                          {t("console.projects.advancing.packet.audiences.presetNone", undefined, "None (manual)")}
                        </option>
                        {presetTypes.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                    {t("console.projects.advancing.packet.audiences.contacts", undefined, "Contacts")}
                  </span>
                  <textarea
                    name="contacts"
                    rows={3}
                    required
                    className="ps-input w-full"
                    placeholder={t(
                      "console.projects.advancing.packet.audiences.contactsPlaceholder",
                      undefined,
                      "One per line: Jordan Reyes <jordan@lasernet.example> or a bare email",
                    )}
                  />
                </label>
              </FormShell>
            </div>
          </details>
        </section>

        {/* Scoping matrix: audience × section */}
        <section className="space-y-3">
          <h3>{t("console.projects.advancing.packet.matrix.heading", undefined, "Scoping Matrix")}</h3>
          {audiences.length === 0 || sections.length === 0 ? (
            <p className="ps-caption text-[var(--p-text-2)]">
              {t(
                "console.projects.advancing.packet.matrix.needBoth",
                undefined,
                "Add at least one section and one audience to scope the packet.",
              )}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th>{t("console.projects.advancing.packet.matrix.audience", undefined, "Audience")}</th>
                    {sections.map((s) => (
                      <th key={s.id} className="text-center">
                        {s.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {audiences.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {a.team ? `${a.team} · ${a.company}` : a.company}
                      </td>
                      {sections.map((s) => {
                        const cell = assignmentByPair.get(`${a.id}:${s.id}`);
                        return (
                          <td key={s.id} className="text-center">
                            {cell ? (
                              <div className="inline-flex items-center gap-1">
                                <Badge
                                  variant={
                                    cell.requirement === "required"
                                      ? "success"
                                      : cell.requirement === "optional"
                                        ? "info"
                                        : "muted"
                                  }
                                >
                                  {cell.requirement === "required"
                                    ? t("console.projects.advancing.packet.matrix.required", undefined, "Req")
                                    : cell.requirement === "optional"
                                      ? t("console.projects.advancing.packet.matrix.optional", undefined, "Opt")
                                      : t("console.projects.advancing.packet.matrix.hidden", undefined, "Hidden")}
                                </Badge>
                                {cell.due_at && <span className="font-mono text-xs">{fmtDate(cell.due_at)}</span>}
                                <form action={removeAssignmentAction.bind(null, projectId)} className="inline">
                                  <input type="hidden" name="assignment_id" value={cell.id} />
                                  <button
                                    type="submit"
                                    className="ps-btn ps-btn--sm"
                                    aria-label={t(
                                      "console.projects.advancing.packet.matrix.clearCell",
                                      undefined,
                                      "Clear assignment",
                                    )}
                                  >
                                    ×
                                  </button>
                                </form>
                              </div>
                            ) : (
                              <span className="text-[var(--p-text-3)]">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {audiences.length > 0 && sections.length > 0 && (
            <form
              action={assignSectionAction.bind(null, projectId)}
              className="surface flex flex-wrap items-end gap-3 p-6"
            >
              <input type="hidden" name="packet_id" value={packet.id} />
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                  {t("console.projects.advancing.packet.matrix.audience", undefined, "Audience")}
                </span>
                <select name="audience_id" className="ps-input ps-input--sm">
                  {audiences.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.team ? `${a.team} · ${a.company}` : a.company}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                  {t("console.projects.advancing.packet.matrix.section", undefined, "Section")}
                </span>
                <select name="section_id" className="ps-input ps-input--sm">
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                  {t("console.projects.advancing.packet.matrix.requirement", undefined, "Requirement")}
                </span>
                <select name="requirement" className="ps-input ps-input--sm" defaultValue="required">
                  <option value="required">
                    {t("console.projects.advancing.packet.matrix.requiredFull", undefined, "Required")}
                  </option>
                  <option value="optional">
                    {t("console.projects.advancing.packet.matrix.optionalFull", undefined, "Optional")}
                  </option>
                  <option value="hidden">
                    {t("console.projects.advancing.packet.matrix.hiddenFull", undefined, "Hidden")}
                  </option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                  {t("console.projects.advancing.packet.matrix.due", undefined, "Due")}
                </span>
                <input type="datetime-local" name="due_at" className="ps-input ps-input--sm" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-[var(--p-text-2)]">
                  {t("console.projects.advancing.packet.matrix.assignedVia", undefined, "Assigned Via")}
                </span>
                <select name="assigned_via" className="ps-input ps-input--sm" defaultValue="manual">
                  <option value="manual">
                    {t("console.projects.advancing.packet.matrix.viaManual", undefined, "Manual")}
                  </option>
                  <option value="contract_override">
                    {t("console.projects.advancing.packet.matrix.viaContract", undefined, "Contract Override")}
                  </option>
                </select>
              </label>
              <button type="submit" className={buttonVariants({ size: "sm" })}>
                {t("console.projects.advancing.packet.matrix.assign", undefined, "Assign")}
              </button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
