export type AvatarSize = "sm" | "md" | "lg";

const SIZE: Record<AvatarSize, string> = {
  sm: "w-6 h-6 text-[0.5625rem]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

export function Avatar({ name, size = "md", className = "" }: { name?: string | null; size?: AvatarSize; className?: string }) {
  const initial = name?.[0]?.toUpperCase() || "?";
  return (
    <div
      aria-label={name ?? "User"}
      className={`rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center font-medium text-[var(--text-secondary)] ${SIZE[size]} ${className}`}
    >
      {initial}
    </div>
  );
}
