import { Button } from "@/components/ui/Button";
import { getRequestT } from "@/lib/i18n/request";

/**
 * 404 boundary for the LEG3ND shell — renders inside the LEG3ND `<main>` so the
 * Knowledge/LMS chrome (sidebar + wordmark) is preserved instead of bubbling to
 * the root not-found.
 */
export default async function LegendNotFound() {
  const { t } = await getRequestT();
  return (
    <div className="surface p-8">
      <p className="eyebrow">{t("console.legend.notFound.eyebrow", undefined, "404")}</p>
      <h1 className="mt-1 text-[var(--p-text-1)]">{t("console.legend.notFound.title", undefined, "Not Found")}</h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t("console.legend.notFound.subtitle", undefined, "That page or resource doesn't exist, or you don't have access.")}
      </p>
      <div className="mt-4">
        <Button href="/legend">{t("console.legend.notFound.back", undefined, "Back to LEG3ND")}</Button>
      </div>
    </div>
  );
}
