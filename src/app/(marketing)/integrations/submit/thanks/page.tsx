import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { buildMetadata } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.integrations.thanks.meta.title", undefined, "Submission Received: ATLVS Partner Program"),
    description: t(
      "marketing.integrations.thanks.meta.description",
      undefined,
      "Your partner integration proposal is in the queue.",
    ),
    path: "/integrations/submit/thanks",
  });
}

export default async function Page() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("common.home", undefined, "Home"), href: "/" },
    {
      label: t("marketing.integrations.crumbsLabel", undefined, "Integrations"),
      href: "/integrations",
    },
    {
      label: t("marketing.integrations.thanks.crumbsLabel", undefined, "Submission Received"),
      href: "/integrations/submit/thanks",
    },
  ];

  return (
    <div>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />
      <section className="mx-auto max-w-2xl px-6 pt-12 pb-20 text-center">
        <div className="eyebrow eyebrow-brand">{t("marketing.integrations.eyebrow", undefined, "Partner Program")}</div>
        <h1 className="hed-3xl mt-4">{t("marketing.integrations.thanks.title", undefined, "Submission Received.")}</h1>
        <p className="mt-5 text-lg text-[var(--p-text-2)]">
          {t(
            "marketing.integrations.thanks.body.before",
            undefined,
            "Your proposal is in the queue. The ATLVS partner-AM team typically replies within 5 business days. Watch the inbox you submitted with. We'll reach out from",
          )}{" "}
          <span className="font-mono">partners@atlvs.pro</span>.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button href="/integrations">
            {t("marketing.integrations.thanks.cta.back", undefined, "Back to live integrations")}
          </Button>
          <Button href="/integrations/partners" variant="ghost">
            {t("marketing.integrations.thanks.cta.directory", undefined, "See the partner directory")}
          </Button>
        </div>
      </section>
    </div>
  );
}
