import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { STATUS_TONE, type InquiryState, type InquirySubjectKind } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { setInquiryState } from "./actions";

export const dynamic = "force-dynamic";

type InquiryRow = {
  id: string;
  subject_kind: InquirySubjectKind;
  subject_name: string;
  inquiry_state: InquiryState;
  message: string;
  event_date: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.marketplace.inquiries.eyebrow", undefined, "Marketplace")}
          title={t("console.marketplace.inquiries.title", undefined, "Inquiries")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.marketplace.inquiries.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("marketplace_inquiries")
    .select(
      "id, subject_kind, subject_name, inquiry_state, message, event_date, contact_email, contact_phone, created_at",
    )
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as InquiryRow[];
  const open = rows.filter((r) => r.inquiry_state === "new").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.marketplace.inquiries.eyebrow", undefined, "Marketplace")}
        title={t("console.marketplace.inquiries.title", undefined, "Inquiries")}
        subtitle={t(
          "console.marketplace.inquiries.subtitle",
          { total: rows.length, open },
          `${rows.length} Total · ${open} New`,
        )}
      />
      <div className="page-content space-y-5">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.marketplace.inquiries.empty.title", undefined, "No Inquiries Yet")}
            description={t(
              "console.marketplace.inquiries.empty.description",
              undefined,
              "Quote requests and booking inquiries from your public marketplace profiles land here.",
            )}
          />
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="surface flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{r.subject_name}</span>
                    <Badge variant="muted">{toTitle(r.subject_kind)}</Badge>
                    <Badge variant={STATUS_TONE[r.inquiry_state] ?? "muted"}>{toTitle(r.inquiry_state)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--p-text-2)]">
                    {fmt.date(new Date(r.created_at))}
                    {r.event_date
                      ? " · " +
                        t(
                          "console.marketplace.inquiries.eventOn",
                          { date: fmt.date(new Date(`${r.event_date}T00:00:00`)) },
                          `Event ${fmt.date(new Date(`${r.event_date}T00:00:00`))}`,
                        )
                      : ""}
                    {r.contact_email ? ` · ${r.contact_email}` : ""}
                    {r.contact_phone ? ` · ${r.contact_phone}` : ""}
                  </p>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{r.message}</p>
                </div>
                {r.inquiry_state === "new" || r.inquiry_state === "responded" ? (
                  <div className="flex shrink-0 items-center gap-2">
                    {r.inquiry_state === "new" && (
                      <form action={setInquiryState.bind(null, r.id, "responded")}>
                        <Button size="sm" type="submit">
                          {t("console.marketplace.inquiries.markResponded", undefined, "Mark Responded")}
                        </Button>
                      </form>
                    )}
                    <form action={setInquiryState.bind(null, r.id, "closed")}>
                      <Button size="sm" variant="ghost" type="submit">
                        {t("console.marketplace.inquiries.close", undefined, "Close")}
                      </Button>
                    </form>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
