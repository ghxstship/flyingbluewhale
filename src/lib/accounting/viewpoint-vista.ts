import "server-only";

import { log } from "@/lib/log";

/**
 * Viewpoint Vista sync connector (gap G-013, fourth).
 *
 * Vista exposes data through the Viewpoint Web API (formerly Keystyle).
 * Auth is OAuth-2 client_credentials with a per-tenant token endpoint.
 * Stored in accounting_connections as { token_url, client_id,
 * client_secret, base_url }.
 */

type VistaTokens = {
  token_url: string;
  client_id: string;
  client_secret: string;
  base_url: string;
  access_token?: string;
  expires_at?: number;
};

export function decodeVistaTokens(auth_ciphertext: string): VistaTokens | { error: string } {
  try {
    return JSON.parse(Buffer.from(auth_ciphertext, "base64").toString("utf8"));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not decode Vista tokens" };
  }
}

async function ensureToken(tokens: VistaTokens): Promise<VistaTokens | { error: string }> {
  if (tokens.access_token && tokens.expires_at && Date.now() < tokens.expires_at - 60_000) {
    return tokens;
  }
  const basic = Buffer.from(`${tokens.client_id}:${tokens.client_secret}`).toString("base64");
  const res = await fetch(tokens.token_url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    log.warn("vista.token_failed", { status: res.status, body: text.slice(0, 200) });
    return { error: `Vista token exchange failed: ${res.status}` };
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  return {
    ...tokens,
    access_token: json.access_token,
    expires_at: Date.now() + json.expires_in * 1000,
  };
}

async function getResource<T>(tokens: VistaTokens, path: string): Promise<T[] | { error: string }> {
  const refreshed = await ensureToken(tokens);
  if ("error" in refreshed) return refreshed;
  const url = `${refreshed.base_url.replace(/\/$/, "")}/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${refreshed.access_token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return { error: `Vista ${path} failed: ${res.status}` };
  const json = (await res.json()) as { Items?: T[]; value?: T[] };
  return json.Items ?? json.value ?? [];
}

export async function fetchVistaVendors(tokens: VistaTokens) {
  return getResource<{ VendorCode: string; Name: string; Email?: string; Active?: boolean }>(tokens, "vendors");
}

export async function fetchVistaCostCodes(tokens: VistaTokens) {
  return getResource<{ Phase: string; Description: string; Category?: string }>(tokens, "job-cost-codes");
}
