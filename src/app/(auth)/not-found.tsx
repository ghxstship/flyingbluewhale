import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getRequestT } from "@/lib/i18n/request";

export default async function AuthNotFound() {
  const { t } = await getRequestT();
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      {/* Waypoint brand anchor — auth-page 404 still carries the lockup. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/atlvs-mark.svg" alt="" width={32} height={32} aria-hidden="true" className="mx-auto mb-6" />
      <p className="eyebrow eyebrow-accent">404</p>
      <h1 className="mt-4">
        {t("auth.notFound.title", undefined, "Auth path not found.")}
      </h1>
      <p className="mt-3 text-sm text-[var(--p-text-2)]">
        {t(
          "auth.notFound.body",
          undefined,
          "That sign-in link is no longer valid or never existed. Pick a route below.",
        )}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/login">{t("auth.login.submit", undefined, "Sign in")}</Button>
        <Button href="/signup" variant="secondary">
          {t("auth.signup.submit", undefined, "Create Account")}
        </Button>
        <Link href="/forgot-password" className="ps-btn ps-btn--ghost">
          {t("auth.forgotPassword.title", undefined, "Reset password")}
        </Link>
      </div>
    </div>
  );
}
