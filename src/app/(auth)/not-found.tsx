import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getRequestT } from "@/lib/i18n/request";

export default async function AuthNotFound() {
  const { t } = await getRequestT();
  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        {t("auth.notFound.title", undefined, "Auth path not found.")}
      </h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        {t(
          "auth.notFound.body",
          undefined,
          "That sign-in link is no longer valid or never existed. Pick a route below.",
        )}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/login">{t("auth.login.submit", undefined, "Sign in")}</Button>
        <Button href="/signup" variant="secondary">
          {t("auth.signup.submit", undefined, "Create account")}
        </Button>
        <Link href="/forgot-password" className="btn btn-ghost">
          {t("auth.forgotPassword.title", undefined, "Reset password")}
        </Link>
      </div>
    </main>
  );
}
