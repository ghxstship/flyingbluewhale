import Link from "next/link";
import { getRequestT } from "@/lib/i18n/request";

export default async function MobileNotFound() {
  const { t } = await getRequestT();
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <p className="font-mono text-[11px] tracking-widest text-[var(--p-text-2)] uppercase">404</p>
      <h1 className="mt-2 text-2xl font-semibold">{t("m.notFound.title", undefined, "Surface not found")}</h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t("m.notFound.description", undefined, "This mobile screen isn't in the manifest.")}
      </p>
      <Link href="/m" className="ps-btn mt-6 inline-flex">
        {t("m.notFound.homeCta", undefined, "Home")}
      </Link>
    </main>
  );
}
