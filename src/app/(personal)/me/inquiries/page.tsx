import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { STATUS_TONE, INQUIRY_SUBJECT_PATHS, type InquirySubjectKind, type InquiryState } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type InquiryRow = {
  id: string;
  subject_kind: InquirySubjectKind;
  subject_name: string;
  subject_handle: string;
  inquiry_state: InquiryState;
  message: string;
  event_date: string | null;
  created_at: string;
};

export default async function Page({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { t } = await getRequestT();
  const { sent } = await searchParams;
  if (!hasSupabase) {
    return (
      <div>
        <h1>{t("me.inquiries.title", undefined, "My Inquiries")}</h1>
        <p className="mt-2 text-sm">{t("me.inquiries.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("marketplace_inquiries")
    .select("id, subject_kind, subject_name, subject_handle, inquiry_state, message, event_date, created_at")
    .eq("inquirer_user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as InquiryRow[];

  return (
    <div>
      <div className="eyebrow">
        {t("me.inquiries.eyebrow", undefined, "My inquiries")}
      </div>
      <h1 className="mt-1">{t("me.inquiries.heading", undefined, "Inquiries")}</h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t(
          "me.inquiries.intro",
          undefined,
          "Quote requests and booking inquiries you've sent through the marketplace. State updates land here as operators work their queues.",
        )}
      </p>

      {sent === "1" && (
        <div className="mt-4">
          <Alert kind="success">
            {t("me.inquiries.sentBanner", undefined, "Inquiry sent. The operator sees it in their console now.")}
          </Alert>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t("me.inquiries.empty.title", undefined, "No Inquiries Yet")}
            description={t(
              "me.inquiries.empty.description",
              undefined,
              "Browse the marketplace and reach out to vendors, crew, agencies, or talent to start a thread.",
            )}
            action={
              <Button href="/marketplace">{t("me.inquiries.empty.action", undefined, "Browse the Marketplace")}</Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="surface-raised flex items-start justify-between gap-4 p-4">
              <div className="min-w-0">
                <Link
                  href={`${INQUIRY_SUBJECT_PATHS[r.subject_kind]}/${r.subject_handle}`}
                  className="text-sm font-semibold"
                >
                  {r.subject_name}
                </Link>
                <p className="mt-1 text-xs text-[var(--p-text-2)]">
                  {t(
                    "me.inquiries.sentOn",
                    { date: fmt.date(new Date(r.created_at)) },
                    `Sent ${fmt.date(new Date(r.created_at))}`,
                  )}
                  {r.event_date
                    ? " · " +
                      t(
                        "me.inquiries.eventOn",
                        { date: fmt.date(new Date(`${r.event_date}T00:00:00`)) },
                        `Event ${fmt.date(new Date(`${r.event_date}T00:00:00`))}`,
                      )
                    : ""}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--p-text-2)]">{r.message}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="muted">{toTitle(r.subject_kind)}</Badge>
                <Badge variant={STATUS_TONE[r.inquiry_state] ?? "muted"}>{toTitle(r.inquiry_state)}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
