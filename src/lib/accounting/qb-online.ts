import "server-only";

import { log } from "@/lib/log";

/**
 * QuickBooks Online sync worker scaffold (gap G-013 runtime — first
 * connector). OAuth-2 + realmId + REST.
 *
 * Pulls supported entities (vendors, accounts/cost_codes, bills,
 * invoices) into accounting_sync_runs audit rows and the corresponding
 * ATLVS tables.
 *
 * Activation: set QB_CLIENT_ID + QB_CLIENT_SECRET in .env.local. The
 * /api/v1/integrations/qb-online/oauth-start + callback routes handle
 * the initial token exchange and write the encrypted payload into
 * accounting_connections.
 *
 * Token refresh is on every call: QBO access tokens expire in 1 hour,
 * refresh tokens in 100 days.
 */

const QBO_BASE = "https://quickbooks.api.intuit.com/v3/company";

type TokenPayload = {
  access_token: string;
  refresh_token: string;
  realm_id: string;
  expires_at: number; // epoch ms
};

export function qboConfigured(): boolean {
  return !!process.env.QB_CLIENT_ID && !!process.env.QB_CLIENT_SECRET;
}

/**
 * Exchange the authorization code for tokens. The QBO OAuth callback
 * route calls this once after the user completes the consent flow.
 */
export async function exchangeAuthCode(
  code: string,
  realmId: string,
  redirectUri: string,
): Promise<TokenPayload | { error: string }> {
  const clientId = process.env.QB_CLIENT_ID;
  const clientSecret = process.env.QB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { error: "QB_CLIENT_ID/QB_CLIENT_SECRET not configured" };

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    log.error("qbo.token_exchange_failed", { status: res.status, body: text.slice(0, 200) });
    return { error: `Token exchange failed: ${res.status}` };
  }
  const json = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    realm_id: realmId,
    expires_at: Date.now() + (json.expires_in - 60) * 1000,
  };
}

export async function refreshIfNeeded(tokens: TokenPayload): Promise<TokenPayload | { error: string }> {
  if (Date.now() < tokens.expires_at) return tokens;
  const clientId = process.env.QB_CLIENT_ID;
  const clientSecret = process.env.QB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { error: "QBO credentials missing" };
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    }),
    cache: "no-store",
  });
  if (!res.ok) return { error: `Refresh failed: ${res.status}` };
  const json = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    realm_id: tokens.realm_id,
    expires_at: Date.now() + (json.expires_in - 60) * 1000,
  };
}

/**
 * Fetch vendors from QBO. Returns the parsed array; the sync worker
 * walks the response into vendors rows.
 */
export async function fetchVendors(
  tokens: TokenPayload,
): Promise<
  | Array<{ Id: string; DisplayName: string; PrimaryEmailAddr?: { Address?: string }; Active?: boolean }>
  | { error: string }
> {
  const url = `${QBO_BASE}/${tokens.realm_id}/query?query=${encodeURIComponent("SELECT * FROM Vendor MAXRESULTS 1000")}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return { error: `QBO Vendor query failed: ${res.status}` };
  const json = (await res.json()) as {
    QueryResponse?: {
      Vendor?: Array<{ Id: string; DisplayName: string; PrimaryEmailAddr?: { Address?: string }; Active?: boolean }>;
    };
  };
  return json.QueryResponse?.Vendor ?? [];
}

/**
 * Fetch chart of accounts. Cost codes in QBO live as "Account" rows
 * tagged with AccountType='Expense' / 'CostOfGoodsSold'. We pull them
 * for mapping.
 */
export async function fetchAccounts(
  tokens: TokenPayload,
): Promise<
  Array<{ Id: string; Name: string; AccountType: string; AcctNum?: string; Active?: boolean }> | { error: string }
> {
  const url = `${QBO_BASE}/${tokens.realm_id}/query?query=${encodeURIComponent("SELECT * FROM Account MAXRESULTS 1000")}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) return { error: `QBO Account query failed: ${res.status}` };
  const json = (await res.json()) as {
    QueryResponse?: {
      Account?: Array<{ Id: string; Name: string; AccountType: string; AcctNum?: string; Active?: boolean }>;
    };
  };
  return json.QueryResponse?.Account ?? [];
}

// ============================================================================
// Push-side writes — Round 72.
// ============================================================================

type QboInvoiceLine = {
  Amount: number;
  DetailType: "SalesItemLineDetail";
  Description?: string;
  SalesItemLineDetail: {
    ItemRef: { value: string };
    Qty?: number;
    UnitPrice?: number;
  };
};

type QboInvoicePayload = {
  CustomerRef: { value: string };
  Line: QboInvoiceLine[];
  DocNumber?: string;
  TxnDate?: string; // YYYY-MM-DD
  DueDate?: string;
  CurrencyRef?: { value: string };
  CustomerMemo?: { value: string };
  PrivateNote?: string;
};

/**
 * Push an invoice into QBO. Returns the QBO-assigned Id on success so
 * the caller can stamp invoices.metadata.qb_id for round-trip dedup.
 *
 * Requires a customer mapping — accepts the QBO Customer ref string
 * directly (caller resolves from our clients.metadata.qb_id or
 * lazily-creates a Customer row).
 */
export async function pushInvoice(
  tokens: TokenPayload,
  payload: QboInvoicePayload,
): Promise<{ qb_id: string; sync_token: string } | { error: string }> {
  const url = `${QBO_BASE}/${tokens.realm_id}/invoice?minorversion=70`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `QBO invoice push failed: ${res.status} ${text.slice(0, 200)}` };
  }
  const json = (await res.json()) as { Invoice?: { Id: string; SyncToken: string } };
  if (!json.Invoice?.Id) return { error: "QBO returned no Invoice.Id" };
  return { qb_id: json.Invoice.Id, sync_token: json.Invoice.SyncToken };
}

type QboBillLine = {
  Amount: number;
  DetailType: "AccountBasedExpenseLineDetail";
  Description?: string;
  AccountBasedExpenseLineDetail: {
    AccountRef: { value: string };
  };
};

type QboBillPayload = {
  VendorRef: { value: string };
  Line: QboBillLine[];
  DocNumber?: string;
  TxnDate?: string;
  DueDate?: string;
  CurrencyRef?: { value: string };
  PrivateNote?: string;
};

/**
 * Push an AP bill into QBO. Mirrors pushInvoice for AP-side records
 * (vendor bills, OCR-extracted invoices that were promoted into our
 * invoices table as AP).
 */
export async function pushBill(
  tokens: TokenPayload,
  payload: QboBillPayload,
): Promise<{ qb_id: string; sync_token: string } | { error: string }> {
  const url = `${QBO_BASE}/${tokens.realm_id}/bill?minorversion=70`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: `QBO bill push failed: ${res.status} ${text.slice(0, 200)}` };
  }
  const json = (await res.json()) as { Bill?: { Id: string; SyncToken: string } };
  if (!json.Bill?.Id) return { error: "QBO returned no Bill.Id" };
  return { qb_id: json.Bill.Id, sync_token: json.Bill.SyncToken };
}
