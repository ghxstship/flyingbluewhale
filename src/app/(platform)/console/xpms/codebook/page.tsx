import { ModuleHeader } from "@/components/Shell";
import { Card, CardBody, CardHeader, Badge } from "@/components/ui";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { XPMS_CLASSES, formatXtcCode } from "@/lib/xpms";

export const dynamic = "force-dynamic";

type CodebookRow = {
  class_code: number;
  class_name: string | null;
  division_code: number;
  division_name: string | null;
  section_code: number;
  section_name: string | null;
  line_code: number;
  line_name: string | null;
  face: "org" | "finance" | "both";
  is_position_root: boolean;
};

const FACE_VARIANT: Record<CodebookRow["face"], "info" | "warning" | "success"> = {
  org: "info",
  finance: "success",
  both: "warning",
};

export default async function CodebookPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title="XTC Codebook" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_xtc_codebook")
    .select(
      "class_code, class_name, division_code, division_name, section_code, section_name, line_code, line_name, face, is_position_root",
    )
    .order("line_code");
  const rows = (data ?? []) as CodebookRow[];

  const byClass = new Map<number, CodebookRow[]>();
  rows.forEach((r) => {
    const list = byClass.get(r.class_code) ?? [];
    list.push(r);
    byClass.set(r.class_code, list);
  });

  return (
    <>
      <ModuleHeader
        eyebrow="XPMS · XTC Protocol™"
        title="Codebook"
        subtitle="Class → Division → Section → Line. Append-only governance — codes are stable forever."
      />
      <div className="page-content space-y-4">
        {error ? <div className="surface p-4 text-sm">Could not load codebook: {error.message}</div> : null}
        {XPMS_CLASSES.map((c) => {
          const items = byClass.get(c.code) ?? [];
          return (
            <Card key={c.code}>
              <CardHeader title={`${c.code}000 · ${c.name}`} subtitle={c.domain} />
              <CardBody>
                {items.length === 0 ? (
                  <div className="text-sm text-[var(--text-muted)]">
                    No published line items in this class yet — divisions and sections are reserved.
                  </div>
                ) : (
                  <table className="data-table w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left">Code</th>
                        <th className="text-left">Class</th>
                        <th className="text-left">Division</th>
                        <th className="text-left">Section</th>
                        <th className="text-left">Line item</th>
                        <th className="text-left">Face</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((r) => (
                        <tr key={r.line_code}>
                          <td className="font-mono text-xs">{formatXtcCode(r.line_code)}</td>
                          <td className="text-xs">{r.class_name}</td>
                          <td className="text-xs">{r.division_name}</td>
                          <td className="text-xs">{r.section_name}</td>
                          <td className="text-xs">
                            {r.line_name}
                            {r.is_position_root ? (
                              <span className="ml-2 text-[10px] text-[var(--text-muted)]">root</span>
                            ) : null}
                          </td>
                          <td>
                            <Badge variant={FACE_VARIANT[r.face]}>{r.face}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
