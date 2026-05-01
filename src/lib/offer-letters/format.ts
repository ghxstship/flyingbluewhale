import { env } from "@/lib/env";
import type { OfferLetter } from "./types";

export function offerPublicUrl(token: string): string {
  const base = env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  return `${base}/offer/${token}`;
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "TBD";
  const fmt = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  return fmt((start ?? end)!);
}

export function formatCompensation(letter: OfferLetter): string {
  if (letter.compensation_basis === "tbd" || letter.compensation_cents === 0) {
    return letter.compensation_label || "To be confirmed prior to signature";
  }
  const dollars = (letter.compensation_cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  switch (letter.compensation_basis) {
    case "per_day":
      return `${dollars} per day`;
    case "hourly":
      return `${dollars} per hour`;
    default:
      return dollars;
  }
}
