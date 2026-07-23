import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { FormShell } from "@/components/FormShell";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { INQUIRY_SUBJECT_PATHS, type InquirySubjectKind } from "@/lib/marketplace";
import { submitMarketplaceInquiry } from "./actions";

const INPUT = "ps-input w-full";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

const LIST_LABEL_FALLBACK: Record<InquirySubjectKind, string> = {
  vendor: "Vendors",
  crew: "Crew",
  agency: "Agencies",
  talent: "Talent",
  rfq: "Open RFQs",
};

const TITLE_FALLBACK: Record<InquirySubjectKind, string> = {
  vendor: "Request a Quote",
  crew: "Send an Inquiry",
  agency: "Send an Inquiry",
  talent: "Send a Booking Inquiry",
  rfq: "Express Interest",
};

const SUBMIT_FALLBACK: Record<InquirySubjectKind, string> = {
  vendor: "Send Quote Request",
  crew: "Send Inquiry",
  agency: "Send Inquiry",
  talent: "Send Inquiry",
  rfq: "Send Expression of Interest",
};

type Props = {
  kind: InquirySubjectKind;
  handle: string;
  userId: string;
  /** Resolved from the kind's public directory view by the route page; null = unknown or no longer public. */
  subject: { id: string; name: string } | null;
};

/**
 * Shared body for the five marketplace inquire routes. The route page owns
 * auth (requireSession) and subject resolution against its public view;
 * this panel owns the duplicate guard, the form, and the terminal states.
 */
export async function InquirePanel({ kind, handle, userId, subject }: Props) {
  const { t } = await getRequestT();
  const listPath = INQUIRY_SUBJECT_PATHS[kind];

  const crumbs = [
    {
      label: t("marketing.pages.marketplace-inquire.breadcrumbs.marketplace", undefined, "Marketplace"),
      href: "/marketplace",
    },
    {
      label: t(`marketing.pages.marketplace-inquire.breadcrumbs.${kind}`, undefined, LIST_LABEL_FALLBACK[kind]),
      href: listPath,
    },
  ];
  const inquireCrumb = {
    label: t("marketing.pages.marketplace-inquire.breadcrumbs.inquire", undefined, "Inquire"),
  };

  if (!subject) {
    return (
      <>
        <Breadcrumbs items={[...crumbs, inquireCrumb]} className="mx-auto max-w-2xl px-6 pt-6" />
        <section className="mx-auto max-w-2xl px-6 pt-8 pb-16">
          <h1 className="hed-2xl">
            {t("marketing.pages.marketplace-inquire.gone.title", undefined, "This Listing Is No Longer Available")}
          </h1>
          <p className="mt-3 text-sm text-[var(--p-text-2)]">
            {t(
              "marketing.pages.marketplace-inquire.gone.body",
              undefined,
              "It may have been unpublished or removed. Browse the marketplace for what's live right now.",
            )}
          </p>
          <div className="mt-6">
            <Button href={listPath}>
              {t("marketing.pages.marketplace-inquire.gone.cta", undefined, "Back to the Marketplace")}
            </Button>
          </div>
        </section>
      </>
    );
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("marketplace_inquiries")
    .select("id")
    .eq("subject_kind", kind)
    .eq("subject_id", subject.id)
    .eq("inquirer_user_id", userId)
    .eq("inquiry_state", "new")
    .maybeSingle();

  const detailHref = `${listPath}/${handle}`;
  const subjectCrumb = { label: subject.name, href: detailHref };

  if (existing) {
    return (
      <>
        <Breadcrumbs items={[...crumbs, subjectCrumb, inquireCrumb]} className="mx-auto max-w-2xl px-6 pt-6" />
        <section className="mx-auto max-w-2xl px-6 pt-8 pb-16">
          <h1 className="hed-2xl">
            {t("marketing.pages.marketplace-inquire.already.title", undefined, "Inquiry Already Sent")}
          </h1>
          <p className="mt-3 text-sm text-[var(--p-text-2)]">
            {t(
              "marketing.pages.marketplace-inquire.already.body",
              undefined,
              "You have an open inquiry here. Responses land in your inquiries as the operator works their queue.",
            )}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button href="/me/inquiries">
              {t("marketing.pages.marketplace-inquire.already.cta", undefined, "View My Inquiries")}
            </Button>
            <Button href={detailHref} variant="ghost">
              {t("marketing.pages.marketplace-inquire.already.back", undefined, "Back to the Listing")}
            </Button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs items={[...crumbs, subjectCrumb, inquireCrumb]} className="mx-auto max-w-2xl px-6 pt-6" />

      <section className="mx-auto max-w-2xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {t(`marketing.pages.marketplace-inquire.titles.${kind}`, undefined, TITLE_FALLBACK[kind])}
        </div>
        <h1 className="hed-2xl mt-4">{subject.name}</h1>
        <p className="mt-3 text-sm text-[var(--p-text-2)]">
          {t(
            "marketing.pages.marketplace-inquire.hero.body",
            undefined,
            "Your message lands directly in their operator console. Track the response under My Inquiries.",
          )}
        </p>

        <div className="surface mt-8 p-6">
          <FormShell
            action={submitMarketplaceInquiry.bind(null, kind, handle)}
            cancelHref={detailHref}
            submitLabel={t(`marketing.pages.marketplace-inquire.submit.${kind}`, undefined, SUBMIT_FALLBACK[kind])}
          >
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("marketing.pages.marketplace-inquire.form.message", undefined, "Message")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <textarea
                name="message"
                required
                rows={6}
                minLength={10}
                maxLength={4000}
                placeholder={t(
                  "marketing.pages.marketplace-inquire.form.messagePlaceholder",
                  undefined,
                  "Dates, scope, budget band, and anything else they need to respond.",
                )}
                className={INPUT}
              />
            </label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.pages.marketplace-inquire.form.eventDate", undefined, "Event Date")}
                </span>
                <input type="date" name="event_date" className={INPUT} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.pages.marketplace-inquire.form.contactEmail", undefined, "Contact Email")}
                </span>
                <input
                  type="email"
                  name="contact_email"
                  maxLength={200}
                  placeholder="you@example.com"
                  className={`${INPUT} font-mono`}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LBL}>
                  {t("marketing.pages.marketplace-inquire.form.contactPhone", undefined, "Contact Phone")}
                </span>
                <input type="tel" name="contact_phone" maxLength={40} placeholder="+1 305 555 0100" className={INPUT} />
              </label>
            </div>
          </FormShell>
        </div>
      </section>
    </>
  );
}
