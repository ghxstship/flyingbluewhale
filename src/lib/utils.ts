/** Utility helpers */

type ClassValue = string | boolean | undefined | null | number;

export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatCurrencyDetailed(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(date));
}

export function formatLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'text-text-disabled bg-surface-hover',
    pending: 'text-amber-400 bg-amber-400/10',
    approved: 'text-emerald-400 bg-emerald-400/10',
    rejected: 'text-red-400 bg-red-400/10',
    sent: 'text-blue-400 bg-blue-400/10',
    paid: 'text-emerald-400 bg-emerald-400/10',
    overdue: 'text-red-400 bg-red-400/10',
    active: 'text-emerald-400 bg-emerald-400/10',
    inactive: 'text-text-disabled bg-surface-hover',
  };
  return map[status] ?? 'text-text-secondary bg-surface-hover';
}

export function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(/[\s@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function getPersistedView(key: string): unknown {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`view:${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
