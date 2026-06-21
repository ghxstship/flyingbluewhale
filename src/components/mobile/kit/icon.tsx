"use client";

import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties, MouseEventHandler } from "react";

/**
 * KIcon — the single icon primitive for the COMPVSS mobile kit.
 *
 * Ported from the prototype's global-Lucide `Icon`. Resolves a Lucide
 * component by PascalCase name off the `lucide-react` namespace and
 * renders it; returns null if the name doesn't exist (matching the
 * prototype's graceful no-op).
 */
export type KIconProps = {
  name: string;
  size?: number;
  stroke?: number;
  style?: CSSProperties;
  className?: string;
  onClick?: MouseEventHandler<SVGSVGElement>;
};

export function KIcon({ name, size = 20, stroke = 2, style, className, onClick }: KIconProps) {
  const Cmp = (Lucide as unknown as Record<string, LucideIcon>)[name];
  if (!Cmp) return null;
  return <Cmp size={size} strokeWidth={stroke} style={style} className={className} onClick={onClick} />;
}
