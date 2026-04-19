import "server-only";

import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { BrandedPage, CoverPage, KeyValue, PdfDocument, PdfTable, SectionHeading, styles } from "./layout";
import type { PdfBrand } from "./branding";

/**
 * Proposal PDF — Opportunity #3.
 *
 * Renders `proposals` + `proposals.blocks` jsonb + a `proposal_signatures`
 * list into a branded single-document PDF with cover, scope, pricing,
 * terms, and a signature block. Supports both producer + client
 * branding at cover + header bands.
 *
 * Blocks schema (inferred from existing editor): array of
 *   { kind: "scope" | "deliverables" | "milestones" | "pricing" | "terms" | "prose", … }
 * We accept any shape leniently — every block has a `title` and body.
 */

type ProposalBlock = {
  kind?: string;
  title?: string;
  body?: string;
  items?: Array<{ title?: string; description?: string; amount_cents?: number; note?: string; date?: string }>;
};

export type ProposalPdfInput = {
  brand: PdfBrand;
  proposal: {
    doc_number: string | null;
    title: string;
    status: string | null;
    currency: string;
    amount_cents: number;
    deposit_percent: number | null;
    sent_at: string | null;
    signed_at: string | null;
    expires_at: string | null;
    version: number | null;
    notes: string | null;
  };
  blocks: ProposalBlock[];
  signatures: Array<{
    signer_name: string | null;
    signer_email: string | null;
    signer_role: string | null;
    signature_hash: string | null;
    signed_at: string | null;
    signer_ip: string | null;
  }>;
};

function money(cents: number, currency: string): string {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100); }
  catch { return `${currency} ${(cents / 100).toFixed(2)}`; }
}

export function ProposalPdf({ brand, proposal, blocks, signatures }: ProposalPdfInput) {
  const statusLabel = proposal.signed_at ? "SIGNED" : (proposal.status ?? "draft").toUpperCase();
  return (
    <PdfDocument title={`Proposal ${proposal.doc_number ?? ""} · ${proposal.title}`} author={brand.producerName} subject={proposal.title}>
      <CoverPage
        brand={brand}
        eyebrow={`Proposal · ${statusLabel}`}
        title={proposal.title}
        subtitle={[
          proposal.doc_number ? `# ${proposal.doc_number}` : null,
          proposal.version != null ? `v${proposal.version}` : null,
          money(proposal.amount_cents, proposal.currency),
        ].filter(Boolean).join(" · ") || undefined}
        classification={proposal.signed_at ? "EXECUTED" : undefined}
      />

      <BrandedPage brand={brand} pageLabel={`Proposal ${proposal.doc_number ?? ""}`}>
        <SectionHeading title="Summary" />
        <KeyValue label="Proposal #" value={proposal.doc_number ?? "—"} />
        <KeyValue label="Status" value={statusLabel} />
        <KeyValue label="Total" value={money(proposal.amount_cents, proposal.currency)} />
        {proposal.deposit_percent != null ? (
          <KeyValue label="Deposit" value={`${proposal.deposit_percent}%`} />
        ) : null}
        {proposal.sent_at ? <KeyValue label="Sent" value={proposal.sent_at} /> : null}
        {proposal.expires_at ? <KeyValue label="Expires" value={proposal.expires_at} /> : null}

        {blocks.map((b, i) => (
          <ProposalBlockView key={i} block={b} currency={proposal.currency} />
        ))}

        {proposal.notes ? (
          <>
            <SectionHeading title="Notes" />
            <Text style={styles.p}>{proposal.notes}</Text>
          </>
        ) : null}

        {signatures.length > 0 ? (
          <>
            <SectionHeading title="Signatures" />
            {signatures.map((s, i) => (
              <View key={i} style={{ marginBottom: 8, paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#ddd" }}>
                <Text style={{ fontWeight: 700 }}>{s.signer_name ?? "—"}</Text>
                <Text>{[s.signer_role, s.signer_email].filter(Boolean).join(" · ")}</Text>
                <Text style={{ fontSize: 9, color: "#666" }}>
                  Signed {s.signed_at ?? "—"} from {s.signer_ip ?? "—"}
                </Text>
                {s.signature_hash ? (
                  <Text style={{ fontSize: 8, fontFamily: "Courier", color: "#999" }}>{s.signature_hash}</Text>
                ) : null}
              </View>
            ))}
          </>
        ) : (
          <>
            <SectionHeading title="Signature" />
            <Text style={{ color: "#777" }}>
              Pending — sign the proposal at the shared link to execute.
            </Text>
          </>
        )}
      </BrandedPage>
    </PdfDocument>
  );
}

function ProposalBlockView({ block, currency }: { block: ProposalBlock; currency: string }) {
  const title = block.title ?? block.kind ?? "Section";
  if (block.kind === "pricing" && block.items) {
    return (
      <>
        <SectionHeading title={title} />
        <PdfTable
          columns={[
            { key: "title", label: "Item", width: 5 },
            { key: "description", label: "Description", width: 4 },
            { key: "amount", label: "Amount", width: 2, align: "right" },
          ]}
          rows={block.items.map((it) => ({
            title: it.title ?? "",
            description: it.description ?? "",
            amount: it.amount_cents != null ? money(it.amount_cents, currency) : "",
          }))}
        />
      </>
    );
  }
  if (block.kind === "milestones" && block.items) {
    return (
      <>
        <SectionHeading title={title} />
        <PdfTable
          columns={[
            { key: "title", label: "Milestone", width: 4 },
            { key: "date", label: "Date", width: 2 },
            { key: "description", label: "Description", width: 4 },
          ]}
          rows={block.items.map((it) => ({
            title: it.title ?? "",
            date: it.date ?? "",
            description: it.description ?? "",
          }))}
        />
      </>
    );
  }
  if (block.items && block.items.length > 0) {
    return (
      <>
        <SectionHeading title={title} />
        {block.items.map((it, i) => (
          <View key={i} style={{ marginBottom: 4 }}>
            <Text style={{ fontWeight: 700 }}>{it.title ?? ""}</Text>
            {it.description ? <Text>{it.description}</Text> : null}
            {it.note ? <Text style={{ fontSize: 9, color: "#555" }}>{it.note}</Text> : null}
          </View>
        ))}
      </>
    );
  }
  return (
    <>
      <SectionHeading title={title} />
      {block.body ? <Text style={styles.p}>{block.body}</Text> : null}
    </>
  );
}
