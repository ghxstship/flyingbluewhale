import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";

const BUCKETS = [
  { name: "advancing", visibility: "private", purpose: "Riders, input lists, stage plots" },
  { name: "receipts", visibility: "private", purpose: "Expense receipts" },
  { name: "proposals", visibility: "private", purpose: "Signed proposals" },
  { name: "credentials", visibility: "private", purpose: "COIs, W-9s, licenses" },
  { name: "branding", visibility: "public", purpose: "Logos and brand assets" },
];

export default function FilesPage() {
  return (
    <>
      <ModuleHeader eyebrow="Collaboration" title="Files" subtitle="Storage buckets wired to your org" />
      <div className="page-content">
        <div className="surface overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>Bucket</th><th>Visibility</th><th>Purpose</th></tr></thead>
            <tbody>
              {BUCKETS.map((b) => (
                <tr key={b.name}>
                  <td className="font-mono text-xs">{b.name}</td>
                  <td><Badge variant={b.visibility === "public" ? "info" : "muted"}>{b.visibility}</Badge></td>
                  <td className="text-[var(--text-secondary)]">{b.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
