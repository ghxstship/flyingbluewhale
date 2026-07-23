import type { BrandContext } from "@/lib/branding";

/**
 * Brand Studio live preview — three compact swatches rendered under a resolved
 * `BrandContext` (the canonical `resolveBrand(...).context`): a document
 * masthead, a portal chrome bar, and a ticket/pass stub. Server-safe and
 * self-contained: everything colors from the resolved context passed in, so
 * the preview can never drift from what the resolver actually ships.
 */
export function BrandKitPreview({
  context,
  labels,
}: {
  context: BrandContext;
  labels: {
    docMasthead: string;
    docType: string;
    docNo: string;
    portalChrome: string;
    portalCta: string;
    portalNavItem: string;
    pass: string;
    passKind: string;
    passZone: string;
  };
}) {
  const { producer, joint } = context;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {/* Document masthead */}
      <figure className="overflow-hidden rounded-[var(--p-r-md)] border border-[var(--p-border)]">
        <div className="bg-[var(--p-surface-1)] p-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-cover bg-center"
              style={{
                backgroundColor: joint.accent,
                backgroundImage: producer.logoUrl ? `url(${producer.logoUrl})` : undefined,
                backgroundSize: "18px",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            />
            <span className="min-w-0 truncate text-sm font-semibold">{producer.name}</span>
            <span className="ps-id ml-auto shrink-0 text-[11px] text-[var(--p-text-2)]">{labels.docNo}</span>
          </div>
          <div className="mt-2 text-[11px] font-semibold tracking-[0.18em] uppercase" style={{ color: joint.accent }}>
            {labels.docType}
          </div>
          <div className="mt-2 h-[3px] w-full rounded-full" style={{ background: joint.accent }} />
          <div className="mt-2 space-y-1.5" aria-hidden="true">
            <div className="h-1.5 w-3/4 rounded-full bg-[var(--p-border)]" />
            <div className="h-1.5 w-1/2 rounded-full bg-[var(--p-border)]" />
          </div>
        </div>
        <figcaption className="border-t border-[var(--p-border)] px-3 py-1.5 text-[11px] text-[var(--p-text-2)]">
          {labels.docMasthead}
        </figcaption>
      </figure>

      {/* Portal chrome */}
      <figure className="overflow-hidden rounded-[var(--p-r-md)] border border-[var(--p-border)]">
        <div className="bg-[var(--p-surface-1)]">
          <div className="flex items-center gap-2 border-b border-[var(--p-border)] px-3 py-2">
            {producer.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={producer.logoUrl} alt="" className="h-4 w-auto" />
            ) : (
              <span aria-hidden="true" className="h-4 w-4 rounded" style={{ background: joint.accent }} />
            )}
            <span className="min-w-0 truncate text-xs font-semibold">{producer.name}</span>
            <span
              className="ml-auto shrink-0 rounded px-2 py-1 text-[11px] font-medium"
              style={{ background: joint.accent, color: joint.accentFg }}
            >
              {labels.portalCta}
            </span>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 text-[11px] text-[var(--p-text-2)]">
            <span className="font-medium" style={{ color: joint.accent }}>
              {labels.portalNavItem}
            </span>
            <span aria-hidden="true" className="h-1.5 w-8 rounded-full bg-[var(--p-border)]" />
            <span aria-hidden="true" className="h-1.5 w-8 rounded-full bg-[var(--p-border)]" />
          </div>
        </div>
        <figcaption className="border-t border-[var(--p-border)] px-3 py-1.5 text-[11px] text-[var(--p-text-2)]">
          {labels.portalChrome}
        </figcaption>
      </figure>

      {/* Ticket / pass */}
      <figure className="overflow-hidden rounded-[var(--p-r-md)] border border-[var(--p-border)]">
        <div className="bg-[var(--p-surface-1)]">
          <div
            className="flex items-center justify-between gap-2 px-3 py-2"
            style={{ background: joint.accent, color: joint.accentFg }}
          >
            <span className="min-w-0 truncate text-xs font-semibold">{producer.name}</span>
            <span className="shrink-0 text-[11px] font-semibold tracking-[0.14em] uppercase">{labels.passKind}</span>
          </div>
          <div className="border-b border-dashed border-[var(--p-border)] px-3 py-2">
            <div className="ps-id text-xs">ATL-0042</div>
            <div className="mt-0.5 text-[11px] text-[var(--p-text-2)]">{labels.passZone}</div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2" aria-hidden="true">
            <span className="h-3 w-1 rounded-sm" style={{ background: joint.secondary }} />
            <span className="h-3 w-0.5 rounded-sm bg-[var(--p-text-3)]" />
            <span className="h-3 w-1.5 rounded-sm bg-[var(--p-text-3)]" />
            <span className="h-3 w-0.5 rounded-sm" style={{ background: joint.secondary }} />
            <span className="h-3 w-1 rounded-sm bg-[var(--p-text-3)]" />
          </div>
        </div>
        <figcaption className="border-t border-[var(--p-border)] px-3 py-1.5 text-[11px] text-[var(--p-text-2)]">
          {labels.pass}
        </figcaption>
      </figure>
    </div>
  );
}
