const LOGOS = [
  "BLACK COFFEE",
  "CARLITA",
  "KAZ JAMES",
  "HIALEAH PARK",
  "CORNBREAD HEMP",
  "ELEKTRA RECORDS",
  "RESONATE",
  "GHXSTSHIP",
];

export function LogoCloud({ eyebrow = "Trusted by teams shipping live experiences" }: { eyebrow?: string }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--text-muted)]">{eyebrow}</div>
      <div className="mt-6 grid grid-cols-2 items-center gap-8 sm:grid-cols-4 md:grid-cols-8 md:gap-4">
        {LOGOS.map((l) => (
          <div key={l} className="text-center font-mono text-xs font-semibold tracking-[0.2em] text-[var(--text-muted)]">
            {l}
          </div>
        ))}
      </div>
    </section>
  );
}
