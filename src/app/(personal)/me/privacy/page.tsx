import type { Metadata } from "next";
import { getRequestT } from "@/lib/i18n/request";
import { PrivacyControls } from "./PrivacyControls";

export const metadata: Metadata = {
  title: "Privacy & data",
  description: "Export your data, manage cookie consent, or delete your account.",
};

export default async function PrivacyPage() {
  const { t } = await getRequestT();
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
        {t("me.privacy.eyebrow", undefined, "Account")}
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {t("me.privacy.title", undefined, "Privacy & data")}
      </h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        {t(
          "me.privacy.blurb",
          undefined,
          "Export your data any time. Manage cookie consent. Delete your account with a 30-day grace period.",
        )}
      </p>
      <div className="mt-8">
        <PrivacyControls />
      </div>
    </div>
  );
}
