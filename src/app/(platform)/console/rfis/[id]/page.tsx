import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { Presence } from "@/components/collab/Presence";
import { getPresenceUser } from "@/components/collab/getPresenceUser";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { answerRfi, closeRfi } from "./actions";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  const { data: rfi } = await supabase
    .from("rfis")
    .select(
      "*, project:project_id(name), ball:ball_in_court_id(name, email), asker:asked_by(name, email), answerer:answered_by(name, email)",
    )
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!rfi) notFound();
  const presenceUser = await getPresenceUser(session);

  const project = (rfi.project as unknown as { name: string | null } | null)?.name ?? "—";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.rfis.detail.eyebrow", undefined, "Operations")}
        breadcrumbs={[
          { label: t("console.rfis.detail.breadcrumb", undefined, "RFIs"), href: "/console/rfis" },
          { label: rfi.code },
        ]}
        title={`${rfi.code} — ${rfi.subject}`}
        subtitle={project}
        action={
          <div className="flex items-center gap-2">
            <Presence targetTable="rfis" targetId={id} currentUser={presenceUser} />
            <Badge variant="info">{toTitle(rfi.rfi_state)}</Badge>
            <a
              href={`/console/rfis/${rfi.id}/edit`}
              className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
            >
              {t("common.edit", undefined, "Edit")}
            </a>
            {rfi.rfi_state === "answered" && (
              <form action={closeRfi.bind(null, id)}>
                <button className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium" type="submit">
                  {t("console.rfis.detail.closeRfi", undefined, "Close RFI")}
                </button>
              </form>
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="surface p-4">
          <h3 className="text-sm font-semibold">{t("console.rfis.detail.questionHeading", undefined, "Question")}</h3>
          <p className="mt-2 text-sm whitespace-pre-wrap">{rfi.question}</p>
          {rfi.category && (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("console.rfis.detail.categoryLabel", undefined, "Category:")} {toTitle(rfi.category)}
            </p>
          )}
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.rfis.detail.officialAnswerHeading", undefined, "Official Answer")}
          </h3>
          {rfi.official_answer ? (
            <div className="mt-2">
              <p className="text-sm whitespace-pre-wrap">{rfi.official_answer}</p>
              <p className="mt-2 text-xs text-[var(--p-text-2)]">
                {t("console.rfis.detail.answeredBy", undefined, "Answered by")}{" "}
                {(rfi.answerer as unknown as { name: string | null; email: string | null } | null)?.name ?? "—"}
                {rfi.answered_at ? ` · ${fmt.dateTime(rfi.answered_at)}` : ""}
              </p>
            </div>
          ) : (
            rfi.rfi_state === "open" && (
              <form action={answerRfi.bind(null, id)} className="mt-2 space-y-2">
                <textarea
                  name="official_answer"
                  rows={4}
                  required
                  placeholder={t(
                    "console.rfis.detail.answerPlaceholder",
                    undefined,
                    "Provide the binding response. This becomes the authoritative answer.",
                  )}
                  className={INPUT}
                />
                <div className="flex justify-end">
                  <button type="submit" className="surface hover-lift rounded-md px-3 py-1.5 text-xs font-medium">
                    {t("console.rfis.detail.postAnswer", undefined, "Post Answer")}
                  </button>
                </div>
              </form>
            )
          )}
        </section>

        <ConversationPanel orgId={session.orgId} recordType="rfi" recordId={id} />
      </div>
    </>
  );
}
