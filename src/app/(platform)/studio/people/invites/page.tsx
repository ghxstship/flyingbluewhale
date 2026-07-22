import { ModuleHeader } from "@/components/Shell";
import { urlFor } from "@/lib/urls";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { DataView } from "@/components/views/DataViewServer";
import { isAdmin as sessionIsAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { InviteForm } from "./InviteForm";
import { InviteRowActions } from "./InviteRowActions";
import { SCOPABLE_MODULES } from "./scopable-modules";

type InviteRow = {
  id: string;
  email: string;
  role: string;
  invite_state: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  token: string;
  project_id: string | null;
  project_role: string | null;
  module_scope: string[] | null;
};

function relTime(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(ms);
  const s = Math.round(abs / 1000);
  const m = Math.round(s / 60);
  const h = Math.round(m / 60);
  const d = Math.round(h / 24);
  const fmt = s < 60 ? `${s}s` : m < 60 ? `${m}m` : h < 48 ? `${h}h` : `${d}d`;
  return ms >= 0 ? `in ${fmt}` : `${fmt} ago`;
}

export const dynamic = "force-dynamic";

export default async function InvitesPage({ searchParams }: { searchParams: Promise<{ emailFailed?: string }> }) {
  const { t } = await getRequestT();
  const session = await requireSession();
  const isAdmin = sessionIsAdmin(session);
  const { emailFailed } = await searchParams;

  const supabase = await createClient();
  const [{ data: rawInvites }, { data: projects }] = await Promise.all([
    supabase
      .from("invites")
      .select(
        "id, email, role, invite_state, expires_at, accepted_at, created_at, token, project_id, project_role, module_scope",
      )
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).is("deleted_at", null).order("name"),
  ]);
  const invites = (rawInvites ?? []) as InviteRow[];

  // Build project name lookup so the table can show "<role> on <project>" for
  // scoped invites without an extra join.
  const projectName = new Map<string, string>((projects ?? []).map((p) => [p.id, p.name]));

  const pending = invites.filter((i) => i.invite_state === "pending");
  const history = invites.filter((i) => i.invite_state !== "pending");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.invites.eyebrow", undefined, "People")}
        title={t("console.people.invites.title", undefined, "Invites")}
        subtitle={t("console.people.invites.subtitle", undefined, "Pending organization invitations")}
      />
      <div className="page-content space-y-6">
        {emailFailed === "1" && (
          <Alert kind="warning">
            {t(
              "console.people.invites.emailFailed",
              undefined,
              "The invite was created, but the invitation email could not be sent. Copy the link from the pending row below and share it directly, or use Resend once email delivery recovers.",
            )}
          </Alert>
        )}
        {isAdmin && (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">
              {t("console.people.invites.inviteSomeone", undefined, "Invite Someone")}
            </h3>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "console.people.invites.inviteSomeoneHint",
                undefined,
                "They'll get an email with a link to accept. Expires in 7 days.",
              )}
            </p>
            <div className="mt-4">
              <InviteForm
                projects={(projects ?? []) as Array<{ id: string; name: string }>}
                modules={SCOPABLE_MODULES}
              />
            </div>
          </section>
        )}

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("console.people.invites.pendingHeading", { count: pending.length }, `Pending (${pending.length})`)}
          </h3>
          <div className="mt-3">
            <DataView<InviteRow>
              rows={pending}
              tableId="console:people:invites:pending"
              emptyLabel={t("console.people.invites.empty.title", undefined, "No Pending Invites")}
              emptyDescription={
                isAdmin
                  ? t("console.people.invites.empty.adminDescription", undefined, "Send one above to get started.")
                  : t(
                      "console.people.invites.empty.memberDescription",
                      undefined,
                      "Ask an admin to invite new members.",
                    )
              }
              columns={[
                {
                  key: "email",
                  header: t("console.people.invites.col.email", undefined, "Email"),
                  render: (i) => i.email,
                  accessor: (i) => i.email,
                },
                {
                  key: "role",
                  header: t("console.people.invites.col.role", undefined, "Role"),
                  render: (i) => (
                    <>
                      <Badge variant="brand">{i.role}</Badge>
                      {i.project_id && (
                        <span className="ms-2 text-xs text-[var(--p-text-2)]">
                          + {i.project_role}{" "}
                          {t(
                            "console.people.invites.onProject",
                            {
                              project:
                                projectName.get(i.project_id) ??
                                t("console.people.invites.projectFallback", undefined, "project"),
                            },
                            `on ${projectName.get(i.project_id) ?? "project"}`,
                          )}
                        </span>
                      )}
                      {i.module_scope && i.module_scope.length > 0 && (
                        <span className="ms-2 inline-flex items-center gap-1">
                          <Badge variant="warning">
                            {t("console.people.invites.scopedBadge", undefined, "Scope-Gated")}
                          </Badge>
                          <span className="text-xs text-[var(--p-text-3)]">{i.module_scope.join(" · ")}</span>
                        </span>
                      )}
                    </>
                  ),
                  accessor: (i) => i.role,
                  filterable: true,
                },
                {
                  key: "expires",
                  header: t("console.people.invites.col.expires", undefined, "Expires"),
                  render: (i) => <span className="text-[var(--p-text-2)]">{relTime(i.expires_at)}</span>,
                  accessor: (i) => i.expires_at,
                },
                {
                  key: "actions",
                  header: t("console.people.invites.col.actions", undefined, "Actions"),
                  render: (i) => (
                    <InviteRowActions
                      inviteId={i.id}
                      acceptUrl={urlFor("auth", `/accept-invite/${i.token}`)}
                      isAdmin={isAdmin}
                    />
                  ),
                  sortable: false,
                },
              ]}
            />
          </div>
        </section>

        {history.length > 0 && (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">{t("console.people.invites.history", undefined, "History")}</h3>
            <div className="mt-3">
              <DataView<InviteRow>
                rows={history}
                tableId="console:people:invites:history"
                columns={[
                  {
                    key: "email",
                    header: t("console.people.invites.col.email", undefined, "Email"),
                    render: (i) => i.email,
                    accessor: (i) => i.email,
                  },
                  {
                    key: "role",
                    header: t("console.people.invites.col.role", undefined, "Role"),
                    render: (i) => <span className="text-[var(--p-text-2)]">{i.role}</span>,
                    accessor: (i) => i.role,
                    filterable: true,
                  },
                  {
                    key: "invite_state",
                    header: t("console.people.invites.col.invite_state", undefined, "Status"),
                    render: (i) => (
                      <Badge variant={i.invite_state === "accepted" ? "success" : "muted"}>
                        {toTitle(i.invite_state)}
                      </Badge>
                    ),
                    accessor: (i) => i.invite_state,
                    filterable: true,
                  },
                  {
                    key: "when",
                    header: t("console.people.invites.col.when", undefined, "When"),
                    render: (i) => (
                      <span className="text-[var(--p-text-2)]">{relTime(i.accepted_at ?? i.created_at)}</span>
                    ),
                    accessor: (i) => i.accepted_at ?? i.created_at,
                  },
                ]}
              />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
