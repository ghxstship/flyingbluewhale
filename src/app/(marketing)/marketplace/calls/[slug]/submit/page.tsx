import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MultiStepForm } from "@/components/forms/MultiStepForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { submitToCall } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

type Row = {
  id: string;
  public_slug: string;
  kind: string;
  title: string;
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  deadline_at: string | null;
  org_name: string;
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const crumbs = [
    {
      label: t("marketing.pages.marketplace.calls.submit.breadcrumbs.marketplace", undefined, "Marketplace"),
      href: "/marketplace",
    },
    {
      label: t("marketing.pages.marketplace.calls.submit.breadcrumbs.calls", undefined, "Open Calls"),
      href: "/marketplace/calls",
    },
  ];

  const { data } = await supabase.from("public_open_calls").select("*").eq("public_slug", slug).maybeSingle();
  if (!data) {
    return (
      <>
        <Breadcrumbs
          items={[
            ...crumbs,
            { label: t("marketing.pages.marketplace.calls.submit.breadcrumbs.submit", undefined, "Submit") },
          ]}
          className="mx-auto max-w-2xl px-6 pt-6"
        />
        <section className="mx-auto max-w-2xl px-6 pt-8 pb-16">
          <h1 className="hed-2xl">
            {t("marketing.pages.marketplace.calls.submit.closed.title", undefined, "This Call Is Closed")}
          </h1>
          <p className="mt-3 text-sm text-[var(--p-text-2)]">
            {t(
              "marketing.pages.marketplace.calls.submit.closed.body",
              undefined,
              "This open call is no longer accepting submissions — the deadline may have passed or the slot may be awarded.",
            )}
          </p>
          <div className="mt-6">
            <Button href="/marketplace/calls">
              {t("marketing.pages.marketplace.calls.submit.closed.cta", undefined, "Browse Open Calls")}
            </Button>
          </div>
        </section>
      </>
    );
  }
  const c = data as Row;

  const { data: existing } = await supabase
    .from("open_call_submissions")
    .select("id")
    .eq("open_call_id", c.id)
    .eq("submitter_user_id", session.userId)
    .neq("submission_state", "withdrawn")
    .maybeSingle();
  if (existing) {
    return (
      <>
        <Breadcrumbs
          items={[
            ...crumbs,
            { label: c.title, href: `/marketplace/calls/${c.public_slug}` },
            { label: t("marketing.pages.marketplace.calls.submit.breadcrumbs.submit", undefined, "Submit") },
          ]}
          className="mx-auto max-w-2xl px-6 pt-6"
        />
        <section className="mx-auto max-w-2xl px-6 pt-8 pb-16">
          <h1 className="hed-2xl">
            {t("marketing.pages.marketplace.calls.submit.already.title", undefined, "Already Submitted")}
          </h1>
          <p className="mt-3 text-sm text-[var(--p-text-2)]">
            {t(
              "marketing.pages.marketplace.calls.submit.already.body",
              undefined,
              "You've already submitted to this call. Shortlist and award updates land in your submissions.",
            )}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button href="/me/submissions">
              {t("marketing.pages.marketplace.calls.submit.already.cta", undefined, "View My Submissions")}
            </Button>
            <Button href="/marketplace/calls" variant="ghost">
              {t("marketing.pages.marketplace.calls.submit.already.browse", undefined, "Browse More Calls")}
            </Button>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          ...crumbs,
          { label: c.title, href: `/marketplace/calls/${c.public_slug}` },
          { label: t("marketing.pages.marketplace.calls.submit.breadcrumbs.submit", undefined, "Submit") },
        ]}
        className="mx-auto max-w-2xl px-6 pt-6"
      />

      <section className="mx-auto max-w-2xl px-6 pt-8 pb-12">
        <div className="eyebrow eyebrow-brand">
          {toTitle(c.kind)} · {c.org_name}
        </div>
        <h1 className="hed-2xl mt-4">{c.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="info">{formatFeeRange(c.fee_min_cents, c.fee_max_cents, c.currency)}</Badge>
          {c.deadline_at && (
            <Badge variant="warning">
              {t("marketing.pages.marketplace.calls.submit.hero.closesPrefix", undefined, "Closes")}{" "}
              {new Date(c.deadline_at).toLocaleDateString()}
            </Badge>
          )}
        </div>

        <div className="mt-8">
          <MultiStepForm
            action={submitToCall.bind(null, c.public_slug)}
            cancelHref={`/marketplace/calls/${c.public_slug}`}
            submitLabel={t("marketing.pages.marketplace.calls.submit.form.submit", undefined, "Submit To This Call")}
            steps={[
              {
                title: t("marketing.pages.marketplace.calls.submit.form.pitch", undefined, "Pitch"),
                description: t(
                  "marketing.pages.marketplace.calls.submit.form.pitchStep",
                  undefined,
                  "Tell them who you are and why you fit the brief.",
                ),
                fields: (
                  <label className="flex flex-col gap-1.5">
                    <span className={LBL}>
                      {t("marketing.pages.marketplace.calls.submit.form.pitch", undefined, "Pitch")}
                      <span className="ms-0.5 text-[var(--p-danger)]">*</span>
                    </span>
                    <textarea
                      name="cover_note"
                      required
                      rows={6}
                      minLength={10}
                      maxLength={4000}
                      placeholder={t(
                        "marketing.pages.marketplace.calls.submit.form.pitchPlaceholder",
                        undefined,
                        "Who you are, what you'd bring to this slot, and why it fits the brief.",
                      )}
                      className={INPUT}
                    />
                  </label>
                ),
              },
              {
                title: t("marketing.pages.marketplace.calls.submit.form.links", undefined, "Links"),
                description: t(
                  "marketing.pages.marketplace.calls.submit.form.linksStep",
                  undefined,
                  "Optional — work samples, one URL per line.",
                ),
                fields: (
                  <label className="flex flex-col gap-1.5">
                    <span className={LBL}>
                      {t("marketing.pages.marketplace.calls.submit.form.links", undefined, "Links — One Per Line")}
                    </span>
                    <textarea
                      name="links"
                      rows={4}
                      maxLength={2000}
                      placeholder={"https://youtube.com/watch?v=…\nhttps://soundcloud.com/…"}
                      className={`${INPUT} font-mono`}
                    />
                  </label>
                ),
              },
            ]}
          />
        </div>
      </section>
    </>
  );
}
