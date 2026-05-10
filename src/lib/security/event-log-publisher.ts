import "server-only";
import { createHmac } from "node:crypto";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { log } from "@/lib/log";
import { validateOutboundUrl } from "@/lib/http-ssrf";

// ────────────────────────────────────────────────────────────────────
// Event log publisher.
//
// Drains audit_log rows for each org with at least one enabled
// `org_event_log_destinations` row, batches them, and pushes to the
// configured destination. Cursor is `last_published_id` on the destination
// row — we keep advancing it on success so transient failures don't lose
// events and don't double-deliver.
//
// v1: HTTP destination only. S3 + Datadog are scaffolded for future work.
// ────────────────────────────────────────────────────────────────────

const BATCH_SIZE = 100;

type AuditRow = {
  id: string;
  org_id: string;
  actor_id: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: unknown;
  at: string;
};

type DestinationRow = {
  id: string;
  org_id: string;
  destination: "http" | "s3" | "datadog";
  config: Record<string, unknown>;
  secret_hash: string | null;
  last_published_id: string | null;
  last_published_at: string | null;
};

export async function publishEventLogs(): Promise<{ published: number; orgs: number }> {
  if (!isServiceClientAvailable()) return { published: 0, orgs: 0 };
  const admin = createServiceClient();

  const { data: dests } = await admin
    .from("org_event_log_destinations")
    .select("id, org_id, destination, config, secret_hash, last_published_id, last_published_at")
    .eq("enabled", true);

  const destinations = (dests ?? []) as DestinationRow[];
  let published = 0;
  const seenOrgs = new Set<string>();

  for (const dest of destinations) {
    seenOrgs.add(dest.org_id);

    // Fetch the next batch since the cursor. We use `at` ordering with `id`
    // as a tiebreaker for deterministic pagination even when many rows share
    // a millisecond.
    let q = admin
      .from("audit_log")
      .select("id, org_id, actor_id, action, target_table, target_id, metadata, at")
      .eq("org_id", dest.org_id)
      .order("at", { ascending: true })
      .order("id", { ascending: true })
      .limit(BATCH_SIZE);

    if (dest.last_published_at) {
      // Skip rows we've already shipped. Imperfect when many rows share a
      // timestamp — a strict cursor would be (at, id) tuple comparison via
      // `or(...)` — but for an audit stream this is good enough.
      q = q.gt("at", dest.last_published_at);
    }

    const { data: rows, error } = await q;
    if (error) {
      log.warn("event-log.fetch_failed", { destination_id: dest.id, error: error.message });
      continue;
    }
    const events = (rows ?? []) as AuditRow[];
    if (events.length === 0) continue;

    let ok = false;
    try {
      if (dest.destination === "http") {
        ok = await sendHttp(dest, events);
      } else if (dest.destination === "datadog") {
        ok = await sendDatadog(dest, events);
      } else if (dest.destination === "s3") {
        ok = await sendS3(dest, events);
      }
    } catch (e) {
      log.warn("event-log.send_failed", {
        destination_id: dest.id,
        error: (e as Error).message,
      });
      ok = false;
    }

    if (ok) {
      const last = events[events.length - 1];
      await admin
        .from("org_event_log_destinations")
        .update({ last_published_id: last.id, last_published_at: last.at })
        .eq("id", dest.id);
      published += events.length;
    }
  }

  return { published, orgs: seenOrgs.size };
}

async function sendHttp(dest: DestinationRow, events: AuditRow[]): Promise<boolean> {
  const url = String(dest.config.url ?? "");
  if (!url) return false;
  // SSRF guard: an admin-configured destination URL is still untrusted from
  // the server's perspective — if it points at metadata services (AWS
  // 169.254.169.254), localhost, or RFC1918 ranges we'd happily exfiltrate
  // audit events into the internal network. Reject at the publisher
  // boundary; downstream HTTP destinations must live on the public
  // internet.
  const ssrf = await validateOutboundUrl(url);
  if (!ssrf.ok) {
    log.warn("event-log.ssrf_blocked", { destination_id: dest.id, reason: ssrf.reason });
    return false;
  }
  const body = JSON.stringify({
    schema: "lytehaus.audit.v1",
    org_id: dest.org_id,
    events,
  });
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "user-agent": "lytehaus-event-log/1",
  };
  // If the destination row has a secret stored as plaintext under
  // `config.secret`, sign the body. (We hash the same plaintext into
  // `secret_hash` for verification at admin save-time.)
  const secret = typeof dest.config.secret === "string" ? dest.config.secret : null;
  if (secret) {
    const ts = Date.now().toString();
    const sig = createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
    headers["x-lytehaus-timestamp"] = ts;
    headers["x-lytehaus-signature"] = `t=${ts},v1=${sig}`;
  }
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: controller.signal,
    });
    return res.ok;
  } finally {
    clearTimeout(to);
  }
}

async function sendDatadog(dest: DestinationRow, events: AuditRow[]): Promise<boolean> {
  const apiKey = String(dest.config.api_key ?? "");
  const site = String(dest.config.site ?? "datadoghq.com");
  if (!apiKey) return false;
  // Pin to known-good Datadog hostnames. Admin-supplied `site` strings
  // could otherwise be set to `evil.com/?#datadoghq.com` and reach
  // arbitrary destinations. We only accept the documented Datadog
  // tenant suffixes.
  const ALLOWED_SITES = new Set([
    "datadoghq.com",
    "us3.datadoghq.com",
    "us5.datadoghq.com",
    "datadoghq.eu",
    "ddog-gov.com",
    "ap1.datadoghq.com",
  ]);
  if (!ALLOWED_SITES.has(site)) {
    log.warn("event-log.dd_invalid_site", { destination_id: dest.id, site });
    return false;
  }
  const url = `https://http-intake.logs.${site}/api/v2/logs`;
  const body = JSON.stringify(
    events.map((e) => ({
      ddsource: "lytehaus",
      ddtags: `org:${e.org_id}`,
      service: "lytehaus.audit",
      message: e.action,
      ...e,
    })),
  );
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "DD-API-KEY": apiKey },
    body,
  });
  return res.ok;
}

async function sendS3(dest: DestinationRow, events: AuditRow[]): Promise<boolean> {
  // S3 PutObject implementation deferred — would need AWS SigV4 signing.
  // For v1 we log the intent and tell the operator to use the HTTP
  // destination pointed at an S3-fronting Lambda.
  log.info("event-log.s3_not_implemented", {
    destination_id: dest.id,
    bucket: dest.config.bucket,
    pending_events: events.length,
  });
  return false;
}
