import type { ReactNode, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
  icon: "btn-icon h-9 w-9 p-0 inline-flex items-center justify-center",
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
  const { variant = "primary", size = "md", children, className = "", loading, ...rest } = props as BaseProps & {
    children?: ReactNode;
    href?: string;
  } & Record<string, unknown>;

  const cls = `btn btn-${variant} ${SIZE_CLASS[size]} press-scale ${className}`.trim();

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
      <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden="true" />
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
  return (
    <button
      className={cls}
      aria-busy={loading || undefined}
      disabled={loading || (buttonProps as ButtonHTMLAttributes<HTMLButtonElement>).disabled}
      {...(buttonProps as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}
