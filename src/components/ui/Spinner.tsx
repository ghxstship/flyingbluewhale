import { Loader2 } from "lucide-react";

export type SpinnerSize = "xs" | "sm" | "md" | "lg";

const SIZE_PX: Record<SpinnerSize, number> = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 18,
};

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  /** Set when the spinner conveys meaning (e.g. "Loading"). Renders a
   *  visually hidden text node for screen readers. Otherwise the spinner
   *  is decorative (aria-hidden) — wrap it inside an element with the real
   *  semantics (e.g. a button with aria-busy or descriptive label). */
  label?: string;
}

/**
 * Canonical loading spinner. Single source of truth for icon, sizes, and
 * reduced-motion behavior across the platform. Always uses
 * `motion-safe:animate-spin` so users with `prefers-reduced-motion` get
 * a static icon instead of the rotation.
 */
export function Spinner({ size = "sm", className = "", label }: SpinnerProps) {
  return (
    <>
      <Loader2
        size={SIZE_PX[size]}
        className={`motion-safe:animate-spin ${className}`.trim()}
        aria-hidden={label ? undefined : true}
        role={label ? "status" : undefined}
      />
      {label && <span className="sr-only">{label}</span>}
    </>
  );
}
