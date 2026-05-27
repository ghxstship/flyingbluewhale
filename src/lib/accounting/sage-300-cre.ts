import "server-only";

import { log } from "@/lib/log";

/**
 * Sage 300 CRE sync connector (gap G-013, second).
 *
 * Sage 300 CRE doesn't have a hosted REST API like QBO. The canonical
 * integration path is the Sage Construction Operations Open Data
 * Service (formerly Aatrix) which exposes an OData v4 feed over the
 * customer's on-prem Sage installation. Some accounts use a Sage-
 * Intacct migration path; we abstract those behind a single
 * "endpoint URL + bearer token" tuple stored in accounting_connections
 * (tenant_id = base URL, auth_ciphertext = token).
 *
 * If your installation uses the legacy DSN/ODBC path, this connector
 * isn't the right fit — Sage's official 4.1 release ships an OData
 * service that's the canonical option going forward.
 */

export function sageConfigured(connection: { auth_ciphertext: string | null }): boolean {
  return !!connection.auth_ciphertext;
}

type SageTokens = { base_url: string; bearer: string };

export function decodeSageTokens(auth_ciphertext: string): SageTokens | { error: string } {
  try {
    return JSON.parse(Buffer.from(auth_ciphertext, "base64").toString("utf8"));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not decode Sage tokens" };
  }
}

async function odataGet<T>(tokens: SageTokens, entitySet: string): Promise<T[] | { error: string }> {
  const url = `${tokens.base_url.replace(/\/$/, "")}/${entitySet}?$top=1000`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokens.bearer}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    log.warn("sage_300.odata_failed", { entitySet, status: res.status, body: text.slice(0, 200) });
    return { error: `Sage OData ${entitySet} failed: ${res.status}` };
  }
  const json = (await res.json()) as { value?: T[] };
  return json.value ?? [];
}

export async function fetchSageVendors(tokens: SageTokens) {
  // Standard Sage 300 CRE OData vendor entity: 'Vendors' or 'Vendor'.
  // Field names: VendorID, Name, EmailAddress, IsActive.
  return odataGet<{
    VendorID: string;
    Name: string;
    EmailAddress?: string;
    IsActive?: boolean;
  }>(tokens, "Vendors");
}

export async function fetchSageJobCostCodes(tokens: SageTokens) {
  // Job-cost setup: CostCodes feed.
  return odataGet<{
    CostCode: string;
    Description: string;
    Category?: string;
    IsActive?: boolean;
  }>(tokens, "CostCodes");
}
