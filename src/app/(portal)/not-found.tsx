import Link from "next/link";
import { getRequestT } from "@/lib/i18n/request";

export default async function PortalNotFound() {
  const { t } = await getRequestT();
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("p.notFound.eyebrow", undefined, "Not Found")}
      </div>
      <h1 className="mt-3 text-2xl font-semibold">{t("p.notFound.title", undefined, "Project Unavailable")}</h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t(
          "p.notFound.description",
          undefined,
          "The project portal you're looking for doesn't exist, isn't published, or the link has expired.",
        )}
      </p>
      <Link href="/" className="ps-btn ps-btn--ghost mt-6 inline-block">
        {t("common.home", undefined, "Home")}
      </Link>
    </div>
  );
}
