import "server-only";

import { log } from "@/lib/log";

/**
 * Foundation Software sync connector (gap G-013, third).
 *
 * Foundation exposes a REST API behind a customer-issued API key
 * (header X-Foundation-Auth). Base URL is per-tenant. Stored in
 * accounting_connections as { base_url, api_key }.
 */

type FoundationTokens = { base_url: string; api_key: string };

export function decodeFoundationTokens(auth_ciphertext: string): FoundationTokens | { error: string } {
  try {
    return JSON.parse(Buffer.from(auth_ciphertext, "base64").toString("utf8"));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not decode Foundation tokens" };
  }
}

async function getResource<T>(tokens: FoundationTokens, path: string): Promise<T[] | { error: string }> {
  const url = `${tokens.base_url.replace(/\/$/, "")}/${path}?limit=1000`;
  const res = await fetch(url, {
    headers: {
      "X-Foundation-Auth": tokens.api_key,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    log.warn("foundation.fetch_failed", { path, status: res.status, body: text.slice(0, 200) });
    return { error: `Foundation ${path} failed: ${res.status}` };
  }
  const json = (await res.json()) as { items?: T[]; data?: T[] };
  return json.items ?? json.data ?? [];
}

export async function fetchFoundationVendors(tokens: FoundationTokens) {
  return getResource<{ id: string; name: string; email?: string; active?: boolean }>(tokens, "vendors");
}

export async function fetchFoundationCostCodes(tokens: FoundationTokens) {
  return getResource<{ id: string; code: string; description: string; active?: boolean }>(tokens, "cost-codes");
}
