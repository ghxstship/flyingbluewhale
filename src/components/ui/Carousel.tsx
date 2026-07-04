"use client";

import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Carousel — horizontal scroll-snap rail with prev/next buttons, keyboard
 * arrow navigation, snap points, and optional dot pagination. Slides are
 * supplied either as `children` or as an `items` array rendered by `renderItem`.
 *
 * a11y: the scroll region is a `role="group"` with
 * `aria-roledescription="carousel"`; each slide is `aria-roledescription="slide"`
 * with `aria-label="N of total"`. Arrow keys move focus/scroll between slides
 * (roving), Home/End jump to ends. Dots are a tablist-free button group with
 * `aria-current`. Colors read only from `--p-*`; focus via `.focus-ring`.
 */
export type CarouselProps<T> = {
  /** Data-driven slides. Provide either this + renderItem, or `children`. */
  items?: T[];
  renderItem?: (item: T, index: number) => ReactNode;
  /** Slide nodes (alternative to items/renderItem). */
  children?: ReactNode;
  /** Accessible label for the whole carousel. */
  label: string;
  /** Show dot pagination. Defaults to false. */
  dots?: boolean;
  /** Tailwind/arbitrary width per slide (e.g. "w-64", "w-[280px]"). Default "w-64". */
  slideClassName?: string;
  className?: string;
};

export function Carousel<T>({
  items,
  renderItem,
  children,
  label,
  dots = false,
  slideClassName = "w-64",
  className = "",
}: CarouselProps<T>) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  const slides: ReactNode[] =
    items && renderItem ? items.map((it, i) => renderItem(it, i)) : Children.toArray(children);
  const count = slides.length;

  const scrollToSlide = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, slideRefs.current.length - 1));
    const el = slideRefs.current[clamped];
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    el?.focus({ preventScroll: true });
  }, []);

  // Track the most-visible slide for dots + button disabled state.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const idx = slideRefs.current.indexOf(visible.target as HTMLDivElement);
          if (idx >= 0) setActive(idx);
        }
      },
      { root: scroller, threshold: [0.5, 0.75, 1] },
    );
    slideRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [count]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        scrollToSlide(active + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        scrollToSlide(active - 1);
        break;
      case "Home":
        e.preventDefault();
        scrollToSlide(0);
        break;
      case "End":
        e.preventDefault();
        scrollToSlide(count - 1);
        break;
    }
  };

  const atStart = active <= 0;
  const atEnd = active >= count - 1;

  return (
    <section
      className={`relative ${className}`.trim()}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="mb-2 flex justify-end gap-1">
        <button
          type="button"
          onClick={() => scrollToSlide(active - 1)}
          disabled={atStart}
          aria-label="Previous slide"
          className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)] text-[var(--p-text-1)] outline-none hover:bg-[var(--p-surface-2)] disabled:opacity-40 disabled:hover:bg-[var(--p-surface)]"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => scrollToSlide(active + 1)}
          disabled={atEnd}
          aria-label="Next slide"
          className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)] text-[var(--p-text-1)] outline-none hover:bg-[var(--p-surface-2)] disabled:opacity-40 disabled:hover:bg-[var(--p-surface)]"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Layout wrapper — semantics live on the <section> (carousel) and the
          slides; the keydown here only catches events bubbling from the
          roving-tabindex slide that owns focus. */}
      <div
        ref={scrollerRef}
        role="presentation"
        onKeyDown={onKeyDown}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:thin]"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            ref={(el) => {
              slideRefs.current[i] = el;
            }}
            tabIndex={i === active ? 0 : -1}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            className={`focus-ring shrink-0 snap-start rounded-[var(--p-r,8px)] outline-none ${slideClassName}`}
          >
            {slide}
          </div>
        ))}
      </div>

      {dots && count > 1 && (
        <div className="mt-3 flex justify-center gap-1.5" role="group" aria-label={`${label} pagination`}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              className={`focus-ring h-2 rounded-full outline-none transition-[width,background-color] ${
                i === active ? "w-5 bg-[var(--p-accent)]" : "w-2 bg-[var(--p-border)] hover:bg-[var(--p-text-3)]"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
