/**
 * LEG3ND surface skin (kit v5). The platform shell paints ATLVS (pink); this
 * nested layout re-skins the /console/legend/* subtree to the LEG3ND product —
 * Production Orange accent (data-product="legend") + the airport-signage type
 * axis (data-type="legend"). Both attributes sit on one element so the
 * `[data-ui="saas"][data-product="legend"]` token selectors resolve, and the
 * --p-* custom properties cascade to every descendant.
 */
export default function LegendLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-ui="saas" data-product="legend" data-platform="legend" data-type="legend" className="min-h-0">
      {children}
    </div>
  );
}
