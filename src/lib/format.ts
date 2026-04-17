export function formatMoney(cents: number | null | undefined, currency = "USD") {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export function formatDate(d: string | null | undefined, style: "short" | "medium" | "long" = "short") {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return style === "long"
    ? date.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })
    : style === "medium"
    ? date.toLocaleDateString(undefined, { dateStyle: "medium" })
    : date.toLocaleDateString();
}

export function timeAgo(d: string | null | undefined) {
  if (!d) return "—";
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
}

export function slugify(s: string, max = 48) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max);
}

export function dollarsToCents(v: string | number | undefined | null): number {
  if (v == null || v === "") return 0;
  const n = typeof v === "string" ? parseFloat(v) : v;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function generateNumber(prefix: string) {
  const y = new Date().getFullYear().toString().slice(-2);
  const m = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `${prefix}-${y}${m}`;
}
