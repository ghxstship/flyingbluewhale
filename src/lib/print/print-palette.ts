import { PRODUCT_ACCENTS } from "@/lib/brand";

/**
 * Shared print palette for the public document print views
 * (`/offer/[token]/print`, `/msa/[token]/print`).
 *
 * One CSS block, injected verbatim by every print page via
 * `<style dangerouslySetInnerHTML={{ __html: PRINT_PALETTE_CSS }} />` inside a
 * `<main data-theme="light">` wrapper — so the palette cannot diverge between
 * documents. It pins the `--p-*` tokens to a print-friendly light set and the
 * accent to the ATLVS brand accent (via `PRODUCT_ACCENTS`, the tokens.json
 * mirror), since these letter/agreement documents carry ATLVS chrome, not
 * client white-label branding.
 *
 * Override contract: if a future print surface renders a client-branded doc,
 * inject a SECOND style block after this one that re-sets `--p-accent` (and
 * only `--p-accent`) — never fork this palette.
 */
export const PRINT_PALETTE_CSS = `
  @page { size: Letter; margin: 0.5in; }
  @media print {
    html, body { background: #fff !important; color: #000 !important; }
    .no-print { display: none !important; }
  }
  html, body { background: #fff; color: #000; }
  /* Force the document into a print-friendly palette */
  main[data-theme="light"] {
    --p-bg: #ffffff;
    --p-surface: #ffffff;
    --p-surface-2: #f5f5f3;
    --p-text-1: #0a0a0a;
    --p-text-2: #1a1a1a;
    --p-text-3: #6b6b6b;
    --p-border: #d4d4d4;
    --p-accent: ${PRODUCT_ACCENTS.atlvs};
    color: #0a0a0a;
  }
  main[data-theme="light"] article { color: #0a0a0a; }
  main[data-theme="light"] .surface,
  main[data-theme="light"] .surface-raised {
    background: #ffffff;
    color: #0a0a0a;
    border-color: #d4d4d4;
  }
`;
