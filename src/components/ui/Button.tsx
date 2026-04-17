import type { ReactNode, ButtonHTMLAttributes } from "react";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<ButtonSize, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };

interface Base {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
}
interface AsButton extends Base, Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof Base> { href?: never }
interface AsLink extends Base { href: string; type?: never; disabled?: never; onClick?: never }
export type ButtonProps = AsButton | AsLink;

export function Button({ variant = "primary", size = "md", children, className = "", href, ...rest }: ButtonProps) {
  const cls = `btn btn-${variant} ${SIZE_CLASS[size]} press-scale ${className}`.trim();
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
}
