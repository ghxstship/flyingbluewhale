import type { ReactNode, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

// Map this React API onto the kit's .ps-btn classes
// (design_handoff_atlvs_kit/components.html). Primary = filled accent;
// secondary/ghost = bordered/transparent ghost; danger = filled red;
// icon = the kit's square icon button. The "soft" variant is intentionally
// not exposed in this React API yet — add it only if a consumer needs it.
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "ps-btn",
  secondary: "ps-btn ps-btn--ghost",
  ghost: "ps-btn ps-btn--ghost",
  danger: "ps-btn ps-btn--danger",
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "ps-btn--sm",
  md: "",
  lg: "ps-btn--lg",
  icon: "ps-btn--icon",
};

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Required for icon-only buttons. Enforced at type level. */
  "aria-label"?: string;
  loading?: boolean;
}

type AsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps | "children"> & {
    href?: never;
    children?: ReactNode;
  };

type AsLink = BaseProps & {
  href: string;
  type?: never;
  disabled?: never;
  onClick?: never;
  children?: ReactNode;
  target?: string;
  rel?: string;
};

export type ButtonProps = AsButton | AsLink;

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    children,
    className = "",
    loading,
    ...rest
  } = props as BaseProps & {
    children?: ReactNode;
    href?: string;
  } & Record<string, unknown>;

  const cls = `${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`.replace(/\s+/g, " ").trim();

  // Dev-only enforcement: icon-only buttons MUST have aria-label.
  if (process.env.NODE_ENV !== "production") {
    const text = typeof children === "string" || typeof children === "number";
    const hasAriaLabel = !!props["aria-label"];
    if (size === "icon" && !text && !hasAriaLabel) {
      console.warn("[Button] icon-only Button requires `aria-label` for accessibility.");
    }
  }

  const content = loading ? (
    <>
      <Spinner size="md" />
      <span className="ms-1.5">{children}</span>
    </>
  ) : (
    children
  );

  if ("href" in props && props.href) {
    const { href, target, rel } = props as AsLink;
    return (
      <Link href={href} target={target} rel={rel} className={cls} aria-label={props["aria-label"]}>
        {content}
      </Link>
    );
  }

  const { href: _href, ...buttonProps } = rest as { href?: string };
  void _href;
  // Spread buttonProps FIRST so an explicit `type="submit"` from the caller
  // wins. Default to type="button" so buttons inside <form> don't accidentally
  // submit when the prop is omitted.
  return (
    <button
      type="button"
      {...(buttonProps as ButtonHTMLAttributes<HTMLButtonElement>)}
      className={cls}
      aria-busy={loading || undefined}
      disabled={loading || (buttonProps as ButtonHTMLAttributes<HTMLButtonElement>).disabled}
    >
      {content}
    </button>
  );
}
