import { ModuleHeader } from "@/components/Shell";
import { buttonVariants } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Connect screen for accounting integrations.
 *
 * QuickBooks Online has a self-serve OAuth-2 consent flow
 * (`/api/v1/integrations/qb-online/oauth-start` → Intuit → callback),
 * so we render it as a one-click connect button. No secrets are ever
 * captured in this UI — tokens are exchanged server-side in the callback
 * and sealed into auth_ciphertext by the token vault.
 *
 * The other supported systems (Sage, Foundation, Viewpoint, Acumatica,
 * Xero) do not yet have a self-serve OAuth-start endpoint; their token
 * capture is provisioned out-of-band, so they're listed as not-yet-
 * self-serve rather than offering a secret-capturing form.
 */

const OAUTH_PROVIDERS = [
  {
    key: "qb_online",
    name: "QuickBooks Online",
    desc: "Two-way sync of vendors, cost codes, bills, and GL entries via Intuit OAuth.",
    href: "/api/v1/integrations/qb-online/oauth-start",
  },
] as const;

const MANUAL_PROVIDERS = [
  "Sage 300 CRE",
  "Sage 100 Contractor",
  "Foundation Software",
  "Viewpoint Vista",
  "Viewpoint Spectrum",
  "Acumatica",
  "Xero",
] as const;

export default async function Page() {
  const { t } = await getRequestT();
  await requireSession();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.settings.integrations.accounting.new.eyebrow", undefined, "Settings · Integrations")}
        title={t("console.settings.integrations.accounting.new.title", undefined, "Connect Accounting System")}
        subtitle={t(
          "console.settings.integrations.accounting.new.subtitle",
          undefined,
          "Authorize an external accounting system. Credentials are exchanged via OAuth and never entered here.",
        )}
      />
      <div className="page-content max-w-2xl space-y-5">
        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {t("console.settings.integrations.accounting.new.selfServe", undefined, "Self-Serve")}
          </h2>
          <div className="space-y-3">
            {OAUTH_PROVIDERS.map((p) => (
              <div key={p.key} className="surface-inset flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <p className="mt-1 text-xs text-[var(--p-text-2)]">{p.desc}</p>
                </div>
                {/* Plain anchor: the OAuth-start route is a server GET that
                    302-redirects to Intuit — not a client-routed page. */}
                <a href={p.href} className={buttonVariants({ size: "sm" })}>
                  {t("console.settings.integrations.accounting.new.connect", undefined, "Connect")}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
            {t("console.settings.integrations.accounting.new.contactToEnable", undefined, "Contact-To-Enable")}
          </h2>
          <p className="mb-3 text-xs text-[var(--p-text-2)]">
            {t(
              "console.settings.integrations.accounting.new.manualHelp",
              undefined,
              "These systems are provisioned by the implementations team. Credentials are exchanged out-of-band, not captured in this UI.",
            )}
          </p>
          <ul className="flex flex-wrap gap-2">
            {MANUAL_PROVIDERS.map((name) => (
              <li
                key={name}
                className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs text-[var(--p-text-2)]"
              >
                {name}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
