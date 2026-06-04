import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { getMsaByToken } from "@/lib/msa/queries";
import { MSADocument } from "@/components/msa/MSADocument";
import { PrintTrigger } from "@/app/offer/[token]/print/PrintTrigger";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Master Services Agreement — Print",
  robots: { index: false, follow: false },
};

export default async function PrintPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) notFound();
  const c = await cookies();
  const code = c.get(`msa_${token}`)?.value;
  if (!code) notFound();
  const msa = await getMsaByToken(token, code);
  if (!msa || !msa.id) notFound();

  return (
    <main className="min-h-screen bg-white text-black" data-theme="light">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @page { size: Letter; margin: 0.5in; }
            @media print {
              html, body { background: #fff !important; color: #000 !important; }
              .no-print { display: none !important; }
            }
            html, body { background: #fff; color: #000; }
            main[data-theme="light"] {
              --surface-base: #ffffff;
              --surface-raised: #ffffff;
              --surface-inset: #f5f5f3;
              --text-primary: #0a0a0a;
              --text-secondary: #1a1a1a;
              --text-muted: #6b6b6b;
              --border-default: #d4d4d4;
              --org-primary: #1a4dbb;
              color: #0a0a0a;
            }
            main[data-theme="light"] article { color: #0a0a0a; }
            main[data-theme="light"] .surface,
            main[data-theme="light"] .surface-raised {
              background: #ffffff;
              color: #0a0a0a;
              border-color: #d4d4d4;
            }
          `,
        }}
      />
      <div className="mx-auto max-w-[8in] py-8 print:py-0">
        <div className="no-print mb-6 flex items-center justify-between gap-3 rounded border border-black/20 bg-[var(--p-surface-2)] px-4 py-3 text-xs text-black">
          <div>
            Click <strong>Print / Save as PDF</strong>, then choose <em>Save as PDF</em> in your browser&apos;s print
            dialog.
          </div>
          <div className="flex items-center gap-3">
            <PrintTrigger />
            <a href={`/msa/${token}`} className="text-[var(--color-info)] hover:underline">
              ← Back to MSA
            </a>
          </div>
        </div>
        <MSADocument msa={msa} orgName={msa.org_name} />
      </div>
    </main>
  );
}
