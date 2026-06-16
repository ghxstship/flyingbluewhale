import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

type MessageDetail = {
  id: string;
  project_id: string;
  project_email_id: string | null;
  message_id: string;
  in_reply_to: string | null;
  thread_id: string | null;
  from_email: string;
  from_name: string | null;
  to_emails: string[] | null;
  cc_emails: string[] | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  processed_at: string | null;
  routed_to: string | null;
  routed_id: string | null;
  spam_score: number | null;
  project: { id: string; name: string | null } | null;
  project_email: {
    inbound_local_part: string;
    is_active: boolean;
    notes: string | null;
  } | null;
};

export default async function EmailMessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("inbound_email_messages")
    .select(
      "id, project_id, project_email_id, message_id, in_reply_to, thread_id, from_email, from_name, to_emails, cc_emails, subject, body_text, body_html, received_at, processed_at, routed_to, routed_id, spam_score, project:project_id(id, name), project_email:project_email_id(inbound_local_part, is_active, notes)",
    )
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();

  const message = (data ?? null) as MessageDetail | null;
  if (!message) notFound();

  const subject = message.subject ?? t("console.emailInbox.noSubject", undefined, "(no subject)");
  const inboundAddress = message.project_email
    ? `${message.project_email.inbound_local_part}@in.atlvs.pro`
    : null;

  return (
    <>
      <ModuleHeader
        eyebrow={`${message.from_name ?? ""} <${message.from_email}>`.trim()}
        title={subject}
        subtitle={`${fmt.dateParts(message.received_at, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })} · ${message.routed_to ? toTitle(message.routed_to) : t("console.emailInbox.unrouted", undefined, "Unrouted")}`}
        breadcrumbs={[
          {
            label: t("console.emailInbox.title", undefined, "Email Inbox"),
            href: "/console/email-inbox",
          },
          { label: subject },
        ]}
        action={
          message.project ? (
            <Button href={`/console/projects/${message.project_id}`} size="sm" variant="secondary">
              {t("console.emailInbox.openProject", undefined, "Open Project")}
            </Button>
          ) : undefined
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <Field label={t("console.emailInbox.column.from", undefined, "From")}>
            {`${message.from_name ?? ""} <${message.from_email}>`.trim()}
          </Field>
          <Field label={t("console.emailInbox.column.project", undefined, "Project")}>
            {message.project?.name ?? "—"}
          </Field>
          <Field label={t("console.emailInbox.fields.inboundAddress", undefined, "Inbound Address")} mono>
            {inboundAddress ? (
              <span className="inline-flex items-center gap-2">
                {inboundAddress}
                {message.project_email?.is_active ? (
                  <Badge variant="success">{t("console.emailInbox.active", undefined, "Active")}</Badge>
                ) : (
                  <Badge variant="muted">{t("console.emailInbox.inactive", undefined, "Inactive")}</Badge>
                )}
              </span>
            ) : (
              "—"
            )}
          </Field>
          <Field label={t("console.emailInbox.column.received", undefined, "Received")}>
            {fmt.dateParts(message.received_at, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </Field>
          <Field label={t("console.emailInbox.fields.processed", undefined, "Processed")}>
            {message.processed_at ? timeAgo(message.processed_at) : "—"}
          </Field>
          <Field label={t("console.emailInbox.column.routedTo", undefined, "Routed To")}>
            {message.routed_to ? (
              <Badge variant="success">{toTitle(message.routed_to)}</Badge>
            ) : (
              <Badge variant="muted">{t("console.emailInbox.unrouted", undefined, "Unrouted")}</Badge>
            )}
          </Field>
        </div>

        <div className="metric-grid">
          <Field label={t("console.emailInbox.fields.to", undefined, "To")} mono>
            {message.to_emails && message.to_emails.length > 0 ? message.to_emails.join(", ") : "—"}
          </Field>
          <Field label={t("console.emailInbox.fields.cc", undefined, "Cc")} mono>
            {message.cc_emails && message.cc_emails.length > 0 ? message.cc_emails.join(", ") : "—"}
          </Field>
          <Field label={t("console.emailInbox.fields.thread", undefined, "Thread")} mono>
            {message.thread_id ?? "—"}
          </Field>
          <Field label={t("console.emailInbox.fields.messageId", undefined, "Message ID")} mono>
            {message.message_id}
          </Field>
          <Field label={t("console.emailInbox.fields.spamScore", undefined, "Spam Score")} mono>
            {message.spam_score != null ? fmt.number(message.spam_score) : "—"}
          </Field>
        </div>

        {message.body_text ? (
          <div className="surface p-5">
            <h3 className="text-base font-semibold">{t("console.emailInbox.body", undefined, "Message")}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{message.body_text}</p>
          </div>
        ) : message.body_html ? (
          <div className="surface p-5">
            <h3 className="text-base font-semibold">{t("console.emailInbox.body", undefined, "Message")}</h3>
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("console.emailInbox.htmlOnly", undefined, "This message has HTML content only.")}
            </p>
          </div>
        ) : null}

        {message.project_email?.notes ? (
          <div className="surface p-5">
            <h3 className="text-base font-semibold">
              {t("console.emailInbox.addressNotes", undefined, "Inbound Address Notes")}
            </h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{message.project_email.notes}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono break-all" : ""}`}>{children}</div>
    </div>
  );
}
