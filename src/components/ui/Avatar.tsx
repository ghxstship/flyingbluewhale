/* ═══════════════════════════════════════════════════════
   Avatar — Canonical user initial circle
   Replaces inline initial-circle patterns from
   console sidebar + check-in dashboard.
   ═══════════════════════════════════════════════════════ */

export type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-6 h-6 text-[0.5rem]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

interface AvatarProps {
  name?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initial = name?.[0]?.toUpperCase() || '?';

  return (
    <div
      className={`rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary text-heading ${SIZE_CLASSES[size]} ${className}`}
      aria-label={name ?? 'User avatar'}
    >
      {initial}
    </div>
  );
}
