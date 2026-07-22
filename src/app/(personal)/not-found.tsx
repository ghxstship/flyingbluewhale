import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getRequestT } from "@/lib/i18n/request";

export default async function PersonalNotFound() {
  const { t } = await getRequestT();
  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="eyebrow eyebrow-accent">
        {t("me.notFound.eyebrow", undefined, "404")}
      </p>
      <h1 className="mt-4">
        {t("me.notFound.title", undefined, "Page Not Found.")}
      </h1>
      <p className="mt-3 text-sm text-[var(--p-text-2)]">
        {t(
          "me.notFound.body",
          undefined,
          "That section of your account doesn't exist or has moved. Pick a route below.",
        )}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/me">{t("me.notFound.actions.account", undefined, "Account")}</Button>
        <Button href="/me/security" variant="secondary">
          {t("me.notFound.actions.security", undefined, "Security")}
        </Button>
        <Link href="/" className="ps-btn ps-btn--ghost">
          {t("me.notFound.actions.home", undefined, "Home")}
        </Link>
      </div>
    </main>
  );
}
