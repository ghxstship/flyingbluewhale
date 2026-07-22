import QRCode from "qrcode";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { timeAgo } from "@/lib/format";
import { listMyAssignments, type AssignmentListRow } from "@/lib/db/assignments";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = AssignmentListRow & {
  tier_code: string | null;
  scan_code: string | null;
};

export default async function MyTicketsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div>
        <h1>{t("me.tickets.title", undefined, "My Tickets")}</h1>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">
          {t("me.tickets.configureSupabase", undefined, "Configure Supabase.")}
        </p>
      </div>
    );
  }
  const session = await requireSession();
  const base = await listMyAssignments(session.orgId, session.userId, { kinds: ["ticket"] });

  // Hydrate ticket-specific fields + the active scan code (barcode).
  const supabase = await createClient();
  const ids = base.map((a) => a.id);
  const [{ data: details }, { data: codes }] = ids.length
    ? await Promise.all([
        supabase.from("ticket_assignment_details").select("assignment_id, tier_code").in("assignment_id", ids),
        supabase
          .from("assignment_scan_codes")
          .select("assignment_id, code")
          .in("assignment_id", ids)
          .eq("active", true),
      ])
    : [{ data: [] }, { data: [] }];
  const tierMap = new Map<string, string | null>(
    ((details ?? []) as Array<{ assignment_id: string; tier_code: string | null }>).map((d) => [
      d.assignment_id,
      d.tier_code,
    ]),
  );
  const codeMap = new Map<string, string>(
    ((codes ?? []) as Array<{ assignment_id: string; code: string }>).map((c) => [c.assignment_id, c.code]),
  );

  const rows: Row[] = base.map((a) => ({
    ...a,
    tier_code: tierMap.get(a.id) ?? null,
    scan_code: codeMap.get(a.id) ?? null,
  }));

  // C-05: render each active scan code as a real, gate-scannable QR (same
  // `qrcode` pipeline as /m/pass and the asset stickers) instead of a
  // monospace string nobody can scan. The code text stays as the fallback.
  const qrByCode = new Map<string, string>();
  await Promise.all(
    Array.from(new Set(rows.map((r) => r.scan_code).filter((c): c is string => !!c))).map(async (code) => {
      try {
        qrByCode.set(code, await QRCode.toDataURL(code, { margin: 1, width: 240 }));
      } catch {
        // Fall back to the plain code text below.
      }
    }),
  );

  return (
    <div>
      <h1>{t("me.tickets.title", undefined, "My Tickets")}</h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t("me.tickets.subtitle", { email: session.email }, `Tickets issued to ${session.email}`)}
      </p>
      <div className="mt-6">
        <DataTable<Row>
          rows={rows}
          emptyLabel={t("me.tickets.empty", undefined, "No tickets yet")}
          columns={[
            {
              key: "code",
              header: t("me.tickets.columns.pass", undefined, "Pass"),
              render: (r) => {
                if (!r.scan_code) return <span className="font-mono text-xs">—</span>;
                const qr = qrByCode.get(r.scan_code);
                return (
                  <div className="flex flex-col items-start gap-1 py-1">
                    {qr && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qr}
                        alt={t("me.tickets.qrAlt", { code: r.scan_code }, `QR code for ticket ${r.scan_code}`)}
                        className="h-20 w-20 rounded bg-white p-0.5"
                      />
                    )}
                    <span className="font-mono text-[11px] text-[var(--p-text-2)]">{r.scan_code}</span>
                  </div>
                );
              },
              accessor: (r) => r.scan_code ?? null,
            },
            {
              key: "tier",
              header: t("me.tickets.columns.tier", undefined, "Tier"),
              render: (r) => r.tier_code ?? "—",
              accessor: (r) => r.tier_code,
              filterable: true,
              groupable: true,
            },
            {
              key: "state",
              header: t("me.tickets.columns.state", undefined, "State"),
              render: (r) => <StatusBadge status={r.fulfillment_state} />,
              accessor: (r) => r.fulfillment_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "issued",
              header: t("me.tickets.columns.issued", undefined, "Issued"),
              render: (r) => (r.issued_at ? timeAgo(r.issued_at) : "—"),
              className: "font-mono text-xs",
              accessor: (r) => r.issued_at,
            },
            {
              key: "redeemed",
              header: t("me.tickets.columns.redeemed", undefined, "Redeemed"),
              render: (r) => (r.fulfilled_at ? timeAgo(r.fulfilled_at) : "—"),
              className: "font-mono text-xs",
              accessor: (r) => r.fulfilled_at ?? null,
            },
          ]}
        />
      </div>
    </div>
  );
}
