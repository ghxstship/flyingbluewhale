import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { deleteRateLimitOverride, upsertRateLimitOverride } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  bucket: "ai" | "scan" | "webhook" | "auth";
  limit_count: number;
  window_ms: number;
  created_at: string;
  updated_at: string;
};

const BUCKET_HINT: Record<string, { label: string; description: string }> = {
  ai: { label: "AI", description: "/api/v1/ai/* — Anthropic chat + tools" },
  scan: { label: "Scan", description: "QR / barcode scanner endpoints" },
  webhook: { label: "Webhook", description: "Inbound webhook receivers (Stripe, etc.)" },
  auth: { label: "Auth", description: "Login / signup / password reset" },
};

function humanWindow(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return Number.isInteger(s) ? `${s}s` : `${s.toFixed(1)}s`;
  const m = s / 60;
  if (m < 60) return Number.isInteger(m) ? `${m}m` : `${m.toFixed(1)}m`;
  const h = m / 60;
  return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
}

const BUCKETS: Row["bucket"][] = ["ai", "scan", "webhook", "auth"];

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Rate-Limit Overrides" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("rate_limit_overrides")
    .select("id, bucket, limit_count, window_ms, created_at, updated_at")
    .eq("org_id", session.orgId)
    .order("bucket", { ascending: true });
  const overrides = (rows ?? []) as Row[];
  const configured = new Set(overrides.map((o) => o.bucket));
  const unconfigured = BUCKETS.filter((b) => !configured.has(b));

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Rate-Limit Overrides"
        subtitle={`${overrides.length} of 4 buckets overridden · loosen or tighten the default limits per workspace`}
        breadcrumbs={[{ label: "Settings", href: "/console/settings" }, { label: "Rate Limits" }]}
      />
      <div className="page-content space-y-5">
        <DataTable<Row>
          rows={overrides}
          emptyLabel="No overrides — running platform defaults"
          emptyDescription="Each bucket has a built-in limit. Set an override here to loosen (e.g. higher AI quota) or tighten (e.g. stricter scan throttle) per workspace."
          columns={[
            {
              key: "bucket",
              header: "Bucket",
              render: (r) => (
                <div>
                  <Badge variant="info">{BUCKET_HINT[r.bucket]?.label ?? r.bucket}</Badge>
                  <div className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {BUCKET_HINT[r.bucket]?.description ?? ""}
                  </div>
                </div>
              ),
              accessor: (r) => r.bucket,
              filterable: true,
              groupable: true,
            },
            {
              key: "limit_count",
              header: "Limit",
              render: (r) => (
                <span className="font-mono text-sm">
                  {r.limit_count.toLocaleString()} <span className="text-[var(--text-muted)]">req</span>
                </span>
              ),
              accessor: (r) => r.limit_count,
              mono: true,
            },
            {
              key: "window_ms",
              header: "Window",
              render: (r) => <span className="font-mono text-sm">per {humanWindow(r.window_ms)}</span>,
              accessor: (r) => r.window_ms,
              mono: true,
            },
            {
              key: "rate",
              header: "Effective Rate",
              render: (r) => {
                const perSecond = r.limit_count / (r.window_ms / 1000);
                return (
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {perSecond >= 1 ? `${perSecond.toFixed(1)}/sec` : `${(perSecond * 60).toFixed(1)}/min`}
                  </span>
                );
              },
            },
            {
              key: "actions",
              header: "",
              render: (r) => (
                <DeleteForm
                  action={deleteRateLimitOverride.bind(null, r.id)}
                  confirm={`Delete the "${r.bucket}" override? The bucket reverts to the platform default rate.`}
                />
              ),
            },
          ]}
        />

        <section className="surface p-5">
          <h2 className="text-sm font-semibold">Add / Update Override</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            One active override per bucket. Submitting an existing bucket updates it in place.
          </p>
          <form
            action={upsertRateLimitOverride}
            className="surface-inset mt-3 grid grid-cols-1 gap-2 rounded-md p-3 sm:grid-cols-6"
          >
            <select name="bucket" required defaultValue="ai" className="input-base sm:col-span-2">
              {BUCKETS.map((b) => (
                <option key={b} value={b}>
                  {BUCKET_HINT[b].label}
                </option>
              ))}
            </select>
            <input
              name="limit_count"
              type="number"
              required
              min="1"
              max="1000000"
              placeholder="Requests"
              className="input-base sm:col-span-2"
            />
            <input
              name="window_seconds"
              type="number"
              required
              min="1"
              max="3600"
              placeholder="Window (sec)"
              defaultValue="60"
              className="input-base sm:col-span-1"
            />
            <Button type="submit" size="sm" variant="secondary" className="sm:col-span-1">
              Save
            </Button>
          </form>
        </section>

        {unconfigured.length > 0 && (
          <section className="surface p-5">
            <h2 className="text-sm font-semibold">Unconfigured Buckets</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              These buckets run on platform defaults. Add an override above to change them for this workspace.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {unconfigured.map((b) => (
                <li key={b} className="surface-inset rounded-md p-3 text-xs">
                  <div className="text-sm font-semibold">{BUCKET_HINT[b].label}</div>
                  <div className="text-[var(--text-muted)]">{BUCKET_HINT[b].description}</div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
