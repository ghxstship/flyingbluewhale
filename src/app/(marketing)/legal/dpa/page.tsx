import { getRequestT } from "@/lib/i18n/request";

export default async function DpaPage() {
  const { t } = await getRequestT();
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="hed-xl">{t("marketing.legal.dpa.title", undefined, "Data Processing Addendum")}</h1>
      <p className="mt-4 text-xs text-[var(--p-text-2)]">
        {t("marketing.legal.dpa.lastUpdated", { date: "2026-04-16" }, "Last updated: {date}")}
      </p>
      <div className="mt-8 space-y-4 text-sm text-[var(--p-text-2)]">
        <p>
          {t(
            "marketing.legal.dpa.intro",
            undefined,
            "Our DPA incorporates the EU SCCs and UK IDTA. It auto-applies when you subscribe. Request a counter-signed copy from Settings → Compliance.",
          )}
        </p>
        <ul className="list-disc space-y-1 ps-5">
          <li>{t("marketing.legal.dpa.roles", undefined, "Roles: you are the Controller; we are the Processor.")}</li>
          <li>
            {t("marketing.legal.dpa.subprocessors", undefined, "Subprocessors: Supabase, Stripe, Anthropic, Vercel.")}
          </li>
          <li>{t("marketing.legal.dpa.breach", undefined, "Breach notification: within 48 hours of confirmation.")}</li>
          <li>{t("marketing.legal.dpa.transfers", undefined, "Data transfers: SCCs + UK IDTA where applicable.")}</li>
        </ul>
      </div>
    </div>
  );
}
