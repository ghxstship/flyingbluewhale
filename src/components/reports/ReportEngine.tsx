/**
 * Report engine (kit v6.3). Renders a report definition + a resolved
 * metric-value map into the `kit-reports.css` analytics viz — KPI scorecards,
 * deltas, sparklines, bullet/target bars — inside the shared document shell
 * (`.doc`/`data-brand`/`@media print`), so a report is a brand-aware,
 * contract-bound print/digital artifact. One engine renders all 43 reports
 * from the registry, exactly as DocEngine renders the 29 documents.
 *
 * Data contract: every metric value renders `<span class="mf"
 * data-path="metric.<id>.value">`, matching the kit's report templates and the
 * /metrics + /reports OpenAPI projection.
 */
import type { CSSProperties } from "react";
import type { MetricValue, MetricValues, ReportDef } from "@/lib/reports/registry";
import { getMetric, formatMetricValue } from "@/lib/reports/registry";
import type { OrgBrand, ClientBrand, DocBrand } from "@/components/documents/DocEngine";

// brand vars reused from the documents shell (org/client white-label)
function brandVars(org?: OrgBrand, client?: ClientBrand): CSSProperties {
  const s: Record<string, string> = {};
  if (org?.name) s["--ob-name"] = `"${org.name.replace(/"/g, "")}"`;
  if (org?.accent) s["--ob-accent"] = org.accent;
  if (org?.accentText) s["--ob-accent-text"] = org.accentText;
  if (org?.logo) s["--ob-logo"] = `url(${org.logo})`;
  if (client?.name) s["--cl-name"] = `"${client.name.replace(/"/g, "")}"`;
  return s as CSSProperties;
}

// A metric whose `direction` is "down" is good when it falls (cost, variance):
// invert the delta semantics so a decrease shows green.
function deltaClass(delta: number | null | undefined, direction: "up" | "down"): string {
  if (delta == null || delta === 0) return "delta flat";
  // CSS encodes good/bad: .delta.up=green/.down=red; .delta--inv flips it for
  // "lower is better" metrics (cost, variance) so a decrease shows green.
  const dir = delta > 0 ? "up" : "down";
  const inv = direction === "down" ? " delta--inv" : "";
  return `delta ${dir}${inv}`;
}

function Spark({ series }: { series: number[] }) {
  // normalize to 0..100 bar heights
  const max = Math.max(...series, 1);
  const min = Math.min(...series, 0);
  const range = max - min || 1;
  const hiIdx = series.indexOf(max);
  return (
    <div className="spark" aria-hidden="true">
      {series.map((v, i) => (
        <i
          key={i}
          className={i === hiIdx ? "hi" : undefined}
          style={{ "--v": String(Math.round(((v - min) / range) * 100)) } as CSSProperties}
        />
      ))}
    </div>
  );
}

function KpiTile({ metricId, mv }: { metricId: string; mv: MetricValue | undefined }) {
  const def = getMetric(metricId);
  if (!def) return null;
  const value = mv?.value ?? null;
  const display = formatMetricValue(value, def);
  const delta = mv?.delta ?? null;
  const pctOfTarget =
    def.target != null && value != null && def.target !== 0
      ? Math.max(0, Math.min(100, Math.round((value / def.target) * 100)))
      : null;
  return (
    <div className="kpi">
      <div className="kpi-h">
        <span className="kpi-lab">{def.label}</span>
        <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {/* Surface the confidence grade for non-PUBLISHED (modeled/benchmarked/
              quoted) metrics so a proxy never reads as a hard measurement
              (plumb-line RPT-4). */}
          {def.confidence && def.confidence !== "PUBLISHED" && def.confidence !== "N/A" ? (
            <span
              className="kpi-conf"
              title={`Confidence grade: ${def.confidence}`}
              style={{ fontSize: "9px", letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.65 }}
            >
              {def.confidence}
            </span>
          ) : null}
          {delta != null && (
            <span className={deltaClass(delta, def.direction)}>{Math.abs(delta).toFixed(1)}%</span>
          )}
        </span>
      </div>
      <div className="kpi-val">
        <span className="mf mf--plain" data-path={`metric.${metricId}.value`}>
          {display}
        </span>
        {def.unit && def.format !== "currency" && def.format !== "pct" ? <span className="u"> {def.unit}</span> : null}
      </div>
      {mv?.series && mv.series.length > 1 ? (
        <Spark series={mv.series} />
      ) : pctOfTarget != null ? (
        <div className="bullet" style={{ gridTemplateColumns: "1fr 44px", borderBottom: 0, padding: 0 }}>
          <div className="b-track">
            <div
              className={`b-fill${pctOfTarget < 60 ? " bad" : pctOfTarget < 85 ? " warn" : ""}`}
              style={{ "--v": String(pctOfTarget) } as CSSProperties}
            />
            <div className="b-target" style={{ "--t": "100" } as CSSProperties} />
          </div>
          <span className="b-val">{pctOfTarget}%</span>
        </div>
      ) : (
        <span className="kpi-sub">
          {def.target != null ? `Target ${formatMetricValue(def.target, def)}` : def.grain}
        </span>
      )}
    </div>
  );
}

export function ReportRenderer({
  report,
  values,
  brand = "atlvs",
  org,
  client,
  showMergeFields = false,
  generatedAt,
}: {
  report: ReportDef;
  values: MetricValues;
  brand?: DocBrand;
  org?: OrgBrand;
  client?: ClientBrand;
  showMergeFields?: boolean;
  generatedAt?: string;
}) {
  const product = report.app === "ALL" ? "atlvs" : report.app.toLowerCase();
  const summaryIds = report.metrics.slice(0, 4);
  return (
    <div className="rpt-stage" data-ui="saas" data-product={product} data-type="monument">
      <div
        className="doc doc--report"
        data-doc={`report:${report.id}`}
        data-brand={brand}
        data-client={client?.name ? "on" : "off"}
        data-mf={showMergeFields ? "on" : "off"}
        style={brandVars(org, client)}
      >
        <div className="doc-head">
          <div className="brandrow">
            <span className="mk">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/atlvs-mark-white.svg" alt="" width={19} height={19} aria-hidden="true" />
            </span>
            <span className="doc-brandname" />
          </div>
          <div>
            <div className="doctype">{report.kind} · report</div>
            <div className="docno">{report.title}</div>
          </div>
        </div>

        {summaryIds.length > 0 && (
          <div className="rpt-summary" style={{ "--cols": String(summaryIds.length) } as CSSProperties}>
            {summaryIds.map((id) => {
              const def = getMetric(id);
              const mv = values[id];
              return (
                <div key={id}>
                  <div className="k">{def?.label ?? id}</div>
                  <div className="v">
                    <span className="mf mf--plain" data-path={`metric.${id}.value`}>
                      {def ? formatMetricValue(mv?.value ?? null, def) : "—"}
                    </span>
                  </div>
                  {mv?.delta != null && def && (
                    <div className={`d ${deltaClass(mv.delta, def.direction)}`}>{Math.abs(mv.delta).toFixed(1)}%</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="doc-sec">
          <div className="viz-h">
            <span className="t">Metrics</span>
            <span className="m">
              {report.cadence}
              {generatedAt ? ` · ${generatedAt}` : ""}
            </span>
          </div>
          <div className="rpt-grid" style={{ "--cols": "3" } as CSSProperties}>
            {report.metrics.map((id) => (
              <KpiTile key={id} metricId={id} mv={values[id]} />
            ))}
          </div>
        </div>

        <div className="doc-foot">
          {report.title} · {report.cadence} <span className="doc-attrib" />
        </div>
      </div>
    </div>
  );
}
