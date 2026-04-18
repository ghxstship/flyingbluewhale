"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE: Record<AvatarSize, string> = {
  xs: "h-5 w-5 text-[0.5rem]",
  sm: "h-6 w-6 text-[0.5625rem]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-14 w-14 text-base",
};

export type AvatarPresence = "online" | "away" | "busy" | "offline";

const PRESENCE: Record<AvatarPresence, string> = {
  online: "bg-emerald-500",
  away: "bg-amber-500",
  busy: "bg-[var(--color-error)]",
  offline: "bg-[var(--text-muted)]",
};

/** Deterministic color hash for initials-only avatars. */
function hashTo(hue: number): { bg: string; fg: string } {
  return { bg: `oklch(0.88 0.08 ${hue})`, fg: `oklch(0.28 0.12 ${hue})` };
}

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h) % 360;
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export function Avatar({
  src,
  name,
  size = "md",
  presence,
  className = "",
}: {
  src?: string | null;
  name?: string | null;
  size?: AvatarSize;
  presence?: AvatarPresence;
  className?: string;
}) {
  const displayName = name ?? "User";
  const initials = initialsOf(displayName);
  const hue = hashName(displayName);
  const color = hashTo(hue);
  const presenceSize = size === "xs" || size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <AvatarPrimitive.Root
      className={`relative inline-flex shrink-0 overflow-visible rounded-full ${SIZE[size]} ${className}`}
      aria-label={displayName}
    >
      <span className="inline-flex h-full w-full overflow-hidden rounded-full">
        {src && (
          <AvatarPrimitive.Image
            src={src}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        )}
        <AvatarPrimitive.Fallback
          className="flex h-full w-full items-center justify-center font-medium"
          style={{ background: color.bg, color: color.fg }}
        >
          {initials}
        </AvatarPrimitive.Fallback>
      </span>
      {presence && (
        <span
          aria-label={`presence: ${presence}`}
          className={`absolute bottom-0 end-0 rounded-full ring-2 ring-[var(--background)] ${presenceSize} ${PRESENCE[presence]}`}
        />
      )}
    </AvatarPrimitive.Root>
  );
}

/**
 * <AvatarGroup> — overlapping avatars with optional +N overflow.
 */
export function AvatarGroup({
  children,
  max = 3,
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  max?: number;
  size?: AvatarSize;
  className?: string;
}) {
  const kids = React.Children.toArray(children);
  const shown = kids.slice(0, max);
  const overflow = Math.max(0, kids.length - max);
  return (
    <div className={`flex -space-x-2 ${className}`}>
      {shown.map((c, i) => (
        <span key={i} className="ring-2 ring-[var(--background)]">
          {c}
        </span>
      ))}
      {overflow > 0 && (
        <span className="ring-2 ring-[var(--background)]">
          <Avatar name={`+${overflow}`} size={size} />
        </span>
      )}
    </div>
  );
}
