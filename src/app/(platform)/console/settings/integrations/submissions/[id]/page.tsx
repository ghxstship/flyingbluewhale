import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { transitionTier } from "./actions";

export const dynamic = "force-dynamic";

type Tier = "submitted" | "reviewing" | "verified" | "certified" | "rejected";

type Row = {
  id: string;
  slug: string;
  name: string;
  partner_org_name: string;
  partner_contact_email: string;
  partner_contact_name: string | null;
  category: string;
  short_description: string;
  long_description: string | null;
  capabilities: string[];
  homepage_url: string | null;
  docs_url: string | null;
  certification_tier: Tier;
  rejection_reason: string | null;
  published_at: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const TIER_TONE: Record<Tier, "muted" | "info" | "success" | "error"> = {
  submitted: "muted",
  reviewing: "info",
  verified: "info",
  certified: "success",
  rejected: "error",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const { id } = await params;
  await requireSession();
  const { t } = await getRequestT();
  let supabase: LooseSupabase;
  try {
    supabase = createServiceClient() as unknown as LooseSupabase;
  } catch {
    const { createClient } = await import("@/lib/supabase/server");
    supabase = (await createClient()) as unknown as LooseSupabase;
  }

  const { data } = await supabase
    .from("partner_integrations")
    .select(
      "id, slug, name, partner_org_name, partner_contact_email, partner_contact_name, category, short_description, long_description, capabilities, homepage_url, docs_url, certification_tier, rejection_reason, published_at, reviewed_at, created_at",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  const r = data as unknown as Row | null;
  if (!r) notFound();

  const isLive = !!r.published_at && (r.certification_tier === "verified" || r.certification_tier === "certified");

  return (
    <>
      <ModuleHeader
        eyebrow={`${t("console.settings.integrations.submissions.detail.eyebrow", undefined, "Submissions")} · ${r.slug}`}
        title={r.name}
        subtitle={`${r.partner_org_name} · ${toTitle(r.category)}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={TIER_TONE[r.certification_tier]}>{toTitle(r.certification_tier)}</Badge>
            {isLive ? (
              <Badge variant="success">
                {t("console.settings.integrations.submissions.detail.live", undefined, "Live")}
              </Badge>
            ) : null}
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-5">
        <div className="surface p-5">
          <h3 className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            {t("console.settings.integrations.submissions.detail.description", undefined, "Description")}
          </h3>
          <p className="mt-2 text-sm">{r.short_description}</p>
          {r.long_description ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">{r.long_description}</p>
          ) : null}
        </div>

        {r.capabilities.length > 0 ? (
          <div className="surface p-5">
            <h3 className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
              {t("console.settings.integrations.submissions.detail.capabilities", undefined, "Capabilities")}
            </h3>
            <ul className="mt-2 list-disc space-y-1 ps-5 text-sm">
              {r.capabilities.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="surface p-5">
          <h3 className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            {t("console.settings.integrations.submissions.detail.partnerContact", undefined, "Partner contact")}
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-[var(--text-secondary)]">
                {t("console.settings.integrations.submissions.detail.name", undefined, "Name")}
              </div>
              <div>{r.partner_contact_name ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">
                {t("console.settings.integrations.submissions.detail.email", undefined, "Email")}
              </div>
              <a className="font-mono underline" href={`mailto:${r.partner_contact_email}`}>
                {r.partner_contact_email}
              </a>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">
                {t("console.settings.integrations.submissions.detail.homepage", undefined, "Homepage")}
              </div>
              <div className="font-mono text-xs">
                {r.homepage_url ? (
                  <a href={r.homepage_url} className="underline" target="_blank" rel="noreferrer">
                    {r.homepage_url}
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-secondary)]">
                {t("console.settings.integrations.submissions.detail.docs", undefined, "Docs")}
              </div>
              <div className="font-mono text-xs">
                {r.docs_url ? (
                  <a href={r.docs_url} className="underline" target="_blank" rel="noreferrer">
                    {r.docs_url}
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </div>
          </div>
        </div>

        {r.certification_tier === "rejected" && r.rejection_reason ? (
          <div className="surface border-s-4 border-s-[var(--color-error)] p-5">
            <h3 className="text-xs font-semibold tracking-wider text-[var(--color-error)] uppercase">
              {t("console.settings.integrations.submissions.detail.rejectionReason", undefined, "Rejection reason")}
            </h3>
            <p className="mt-2 text-sm">{r.rejection_reason}</p>
          </div>
        ) : null}

        <div className="surface p-5">
          <h3 className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            {t("console.settings.integrations.submissions.detail.certificationQueue", undefined, "Certification queue")}
          </h3>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            {t(
              "console.settings.integrations.submissions.detail.queueIntro",
              undefined,
              "Tier transitions: submitted → reviewing → verified → certified. Reject from any tier with a reason. Publishing flips",
            )}{" "}
            <code className="font-mono">published_at</code>{" "}
            {t(
              "console.settings.integrations.submissions.detail.queueIntroMid",
              undefined,
              "to now (verified + certified rows go public on the",
            )}{" "}
            <Link href="/integrations/partners" className="underline">
              /integrations/partners
            </Link>{" "}
            {t("console.settings.integrations.submissions.detail.queueIntroEnd", undefined, "directory).")}
          </p>
          <form action={transitionTier} className="mt-4 grid gap-3">
            <input type="hidden" name="id" value={r.id} />
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {t("console.settings.integrations.submissions.detail.nextTier", undefined, "Next Tier")}
                </span>
                <select
                  name="next_tier"
                  defaultValue={r.certification_tier}
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
                >
                  {(["submitted", "reviewing", "verified", "certified", "rejected"] as Tier[]).map((tier) => (
                    <option key={tier} value={tier}>
                      {toTitle(tier)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {t(
                    "console.settings.integrations.submissions.detail.publishLabel",
                    undefined,
                    "Publish (live on /integrations/partners)",
                  )}
                </span>
                <select
                  name="publish"
                  defaultValue={r.published_at ? "keep" : "no"}
                  className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
                >
                  <option value="no">
                    {t(
                      "console.settings.integrations.submissions.detail.publishOptions.no",
                      undefined,
                      "Do not publish",
                    )}
                  </option>
                  <option value="now">
                    {t("console.settings.integrations.submissions.detail.publishOptions.now", undefined, "Publish now")}
                  </option>
                  <option value="unpublish">
                    {t(
                      "console.settings.integrations.submissions.detail.publishOptions.unpublish",
                      undefined,
                      "Unpublish",
                    )}
                  </option>
                  <option value="keep">
                    {t(
                      "console.settings.integrations.submissions.detail.publishOptions.keep",
                      undefined,
                      "Keep current",
                    )}
                  </option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                {t(
                  "console.settings.integrations.submissions.detail.rejectionReasonLabel",
                  undefined,
                  "Rejection reason (only if Rejected)",
                )}
              </span>
              <textarea
                name="rejection_reason"
                rows={3}
                maxLength={1000}
                defaultValue={r.rejection_reason ?? ""}
                className="w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm"
              />
            </label>
            <div className="flex justify-end">
              <Button type="submit">
                {t("console.settings.integrations.submissions.detail.applyTransition", undefined, "Apply transition")}
              </Button>
            </div>
          </form>
        </div>

        <Button href="/console/settings/integrations/submissions" variant="ghost">
          {t("console.settings.integrations.submissions.detail.backToQueue", undefined, "Back to queue")}
        </Button>
      </div>
    </>
  );
}
