import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";

/**
 * Server-side PDF render pipeline.
 *
 * `compileToBuffer` — renders a React-PDF document tree to a Buffer.
 *   Pure function; used by tests that want to assert PDF bytes without
 *   touching storage.
 *
 * `compileAndStore` — renders, uploads to a private bucket via
 *   service-role, and returns `{ path, size_bytes, signedUrl }`.
 *   Signed URL TTL is caller-controlled (default 60s matches the
 *   project-wide convention in /api/v1/deliverables/[id]/download).
 *
 * Reporting for the generator is the caller's responsibility — this
 * module just does the bytes + bucket part.
 */

export async function compileToBuffer(doc: ReactElement<DocumentProps>): Promise<Buffer> {
  // React-PDF types Buffer | NodeJS.ReadableStream depending on env; we
  // request Buffer by calling renderToBuffer explicitly.
  const buf = await renderToBuffer(doc);
  return buf as Buffer;
}

export async function compileAndStore(args: {
  doc: ReactElement<DocumentProps>;
  bucket: string;
  path: string;
  contentType?: string;
  signedUrlTtlSeconds?: number;
  contentDisposition?: "inline" | "attachment";
  filenameForAttachment?: string;
}): Promise<{ path: string; size_bytes: number; signedUrl: string }> {
  const buf = await compileToBuffer(args.doc);
  const svc = createServiceClient();

  const { error: upErr } = await svc.storage.from(args.bucket).upload(args.path, buf, {
    contentType: args.contentType ?? "application/pdf",
    upsert: true,
  });
  if (upErr) {
    log.error("pdf.upload_failed", { bucket: args.bucket, path: args.path, err: upErr.message });
    throw upErr;
  }

  const downloadFilename =
    args.contentDisposition === "attachment" && args.filenameForAttachment
      ? args.filenameForAttachment
      : undefined;

  const { data, error: urlErr } = await svc.storage
    .from(args.bucket)
    .createSignedUrl(args.path, args.signedUrlTtlSeconds ?? 60, {
      download: downloadFilename,
    });
  if (urlErr || !data) {
    log.error("pdf.signed_url_failed", { bucket: args.bucket, path: args.path, err: urlErr?.message });
    throw urlErr ?? new Error("createSignedUrl returned null");
  }

  return { path: args.path, size_bytes: buf.byteLength, signedUrl: data.signedUrl };
}
