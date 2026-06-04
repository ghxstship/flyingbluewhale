import { headers } from "next/headers";
import Link from "next/link";
import { shellForHost, urlFor, type Shell } from "@/lib/urls";
import { getRequestT } from "@/lib/i18n/request";
import type { makeT } from "@/lib/i18n/t";

// ────────────────────────────────────────────────────────────────────
// Root not-found. This file is what Next.js renders for *hard* 404s —
// URLs that don't match any route — across every shell. Route-group
// not-found.tsx files (e.g. (platform)/not-found.tsx) only trigger when
// a server component calls `notFound()` from inside that group's tree;
// they're skipped for unrouted paths, which is why the platform/portal/
// mobile shells were falling through to this file with mismatched
// branding and broken Home links.
//
// The fix: read the request host, resolve the shell, paint with that
// shell's data-platform accent, and point the action buttons at routes
// that actually exist on that subdomain (built with urlFor so subdomain
// vs. path-prefix mode flips in one place).
// ────────────────────────────────────────────────────────────────────

type ActionSpec = { label: string; href: string; variant: "primary" | "secondary" };
type TFn = ReturnType<typeof makeT>;

function actionsForShell(shell: Shell, t: TFn): ActionSpec[] {
  switch (shell) {
    case "platform":
      return [
        {
          label: t("notFound.platform.backToConsole", undefined, "Back to Console"),
          href: urlFor("platform", "/"),
          variant: "primary",
        },
        {
          label: t("auth.login.submit", undefined, "Sign in"),
          href: urlFor("auth", "/login"),
          variant: "secondary",
        },
      ];
    case "portal":
      return [
        {
          label: t("nav.home", undefined, "Home"),
          href: urlFor("marketing", "/"),
          variant: "primary",
        },
        {
          label: t("auth.login.submit", undefined, "Sign in"),
          href: urlFor("auth", "/login"),
          variant: "secondary",
        },
      ];
    case "mobile":
      return [
        {
          label: t("notFound.mobile.backToField", undefined, "Back to Field"),
          href: urlFor("mobile", "/"),
          variant: "primary",
        },
        {
          label: t("auth.login.submit", undefined, "Sign in"),
          href: urlFor("auth", "/login"),
          variant: "secondary",
        },
      ];
    case "personal":
      return [
        {
          label: t("notFound.personal.myAccount", undefined, "My Account"),
          href: urlFor("personal", "/me"),
          variant: "primary",
        },
        {
          label: t("nav.home", undefined, "Home"),
          href: urlFor("marketing", "/"),
          variant: "secondary",
        },
      ];
    case "auth":
    case "marketing":
    default:
      return [
        { label: t("nav.home", undefined, "Home"), href: "/", variant: "primary" },
        {
          label: t("notFound.contactUs", undefined, "Contact Us"),
          href: "/contact",
          variant: "secondary",
        },
      ];
  }
}

// data-platform drives --org-primary in globals.css. Apex (marketing/auth/
// personal) inherits the default; subdomain shells lock to their accent.
function platformAttrFor(shell: Shell): string | undefined {
  if (shell === "platform") return "atlvs";
  if (shell === "portal") return "gvteway";
  if (shell === "mobile") return "compvss";
  return undefined;
}

export default async function NotFound() {
  const [h, { t }] = await Promise.all([headers(), getRequestT()]);
  const { shell } = shellForHost(h.get("host"));
  const actions = actionsForShell(shell, t);
  const platformAttr = platformAttrFor(shell);

  return (
    <div
      data-platform={platformAttr}
      className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-24"
    >
      <div className="mx-auto max-w-md text-center">
        {/* Waypoint brand anchor — the root 404 is what Next.js falls
            through to for unrouted paths across every subdomain.
            Carrying the mark gives the page brand integrity instead
            of reading as a generic browser error. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/atlvs-mark.svg" alt="" width={36} height={36} aria-hidden="true" className="mx-auto mb-6" />
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">404</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {t("notFound.title", undefined, "Not Found")}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {t("notFound.body", undefined, "The page you're looking for doesn't exist, or the link has expired.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className={`btn btn-${a.variant}`}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
