import type { ReactNode } from "react";

/**
 * Canonical download affordance for server-rendered document/report endpoints.
 *
 * The generator routes under `/api/v1/**` compile the artifact and 302-redirect
 * to a short-TTL signed storage URL, so a plain anchor (NOT a Next <Link>, which
 * would client-navigate) is the correct primitive: the browser follows the
 * redirect and downloads/opens the file. This normalizes the ad-hoc
 * `<a target="_blank" rel="noopener" class="rounded-md border …">` anchors that
 * had accreted across detail pages (pay-apps, OSHA, BIM, …) into one component.
 */
export function DownloadLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={
        className ??
        "rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
      }
    >
      {children}
    </a>
  );
}
