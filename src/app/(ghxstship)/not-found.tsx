import Link from "next/link";
import { getRequestT } from "@/lib/i18n/request";

export default async function GhxstshipNotFound() {
  const { t } = await getRequestT();
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="text-xs font-semibold tracking-[0.25em] text-[var(--p-accent)] uppercase">404</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">
        {t("ghxstship.notFound.title", undefined, "Not Found.")}
      </h1>
      <p className="mt-3 text-sm text-[var(--p-text-2)]">
        {t("ghxstship.notFound.body", undefined, "The page doesn’t exist or has moved. Try one of these.")}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/ghxstship" className="ps-btn">
          GHXSTSHIP
        </Link>
        <Link href="/ghxstship/services" className="ps-btn ps-btn--ghost">
          {t("ghxstship.notFound.services", undefined, "Services")}
        </Link>
        <Link href="/ghxstship/contact" className="ps-btn ps-btn--ghost">
          {t("ghxstship.notFound.contact", undefined, "Contact")}
        </Link>
      </div>
    </main>
  );
}
