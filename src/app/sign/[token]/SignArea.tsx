"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { PublicSign, type PublicSignProps } from "./PublicSign";

/**
 * Scroll-through gate for the public e-sign surface (E-02). The document body
 * renders inside a bounded scroll container; the signature form stays disabled
 * until the signer has scrolled to the end (short documents that fit without
 * scrolling unlock immediately). Server-rendered document content is passed
 * through as `children` so the text itself never ships twice.
 */
export function SignArea({
  token,
  labels,
  scrollHint,
  children,
}: {
  token: string;
  labels: PublicSignProps["labels"];
  scrollHint: string;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [readThrough, setReadThrough] = useState(false);

  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 32) setReadThrough(true);
  }, []);

  useEffect(() => {
    // Content shorter than the viewport needs no scrolling to have been read.
    check();
    const el = scrollRef.current;
    if (!el) return;
    const onResize = () => check();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [check]);

  return (
    <div className="space-y-6">
      <div
        ref={scrollRef}
        onScroll={check}
        tabIndex={0}
        role="document"
        aria-label={labels.docAriaLabel}
        className="max-h-[60vh] overflow-y-auto rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-6"
      >
        {children}
      </div>

      <section className="rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)] p-6">
        {!readThrough && (
          <p className="mb-4 text-xs text-[var(--p-text-3)]" role="status">
            {scrollHint}
          </p>
        )}
        <PublicSign token={token} labels={labels} disabled={!readThrough} />
      </section>
    </div>
  );
}
