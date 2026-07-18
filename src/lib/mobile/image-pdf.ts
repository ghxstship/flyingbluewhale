/**
 * Camera-capture → PDF assembly for the COMPVSS Scanner mode (kit 31,
 * live-test resolutions #21/#22). Pure client-side: each captured photo is
 * normalized to JPEG on a canvas, then embedded into a minimal PDF via
 * DCTDecode — no PDF library, no network. The output is a real, standard
 * PDF (one page per capture, page size = image size in points) accepted by
 * every viewer and by the AP-OCR extraction pipeline.
 */

export type JpegPage = { bytes: Uint8Array; width: number; height: number };

const MAX_DIM = 2200; // keep uploads sane; plenty for OCR legibility
const JPEG_QUALITY = 0.85;

/** Normalize any camera capture (HEIC-decoded, PNG, JPEG…) to a JPEG page. */
export async function imageFileToJpegPage(file: File): Promise<JpegPage> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    // White base so transparent captures don't turn black in the JPEG.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error("jpeg encode failed");
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width: w, height: h };
  } finally {
    bitmap.close();
  }
}

const enc = new TextEncoder();

/** Assemble JPEG pages into a single PDF (DCTDecode embed, 1 page each). */
export function jpegPagesToPdf(pages: JpegPage[]): Uint8Array {
  if (pages.length === 0) throw new Error("no pages");

  // Object layout: 1 catalog · 2 pages tree · then per page i:
  // (3+3i) page · (4+3i) image XObject · (5+3i) contents stream.
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let position = 0;

  const push = (part: Uint8Array | string) => {
    const bytes = typeof part === "string" ? enc.encode(part) : part;
    chunks.push(bytes);
    position += bytes.length;
  };
  const beginObj = (num: number) => {
    offsets[num] = position;
    push(`${num} 0 obj\n`);
  };

  push("%PDF-1.4\n");

  const kidRefs = pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
  beginObj(1);
  push("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  beginObj(2);
  push(`<< /Type /Pages /Kids [${kidRefs}] /Count ${pages.length} >>\nendobj\n`);

  pages.forEach((p, i) => {
    const pageNum = 3 + i * 3;
    const imgNum = pageNum + 1;
    const contentNum = pageNum + 2;
    // Points == pixels: fine for on-screen/print viewers and keeps aspect.
    beginObj(pageNum);
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${p.width} ${p.height}] ` +
        `/Resources << /XObject << /Im${i} ${imgNum} 0 R >> >> /Contents ${contentNum} 0 R >>\nendobj\n`,
    );
    beginObj(imgNum);
    push(
      `<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`,
    );
    push(p.bytes);
    push("\nendstream\nendobj\n");
    const content = `q ${p.width} 0 0 ${p.height} 0 0 cm /Im${i} Do Q`;
    beginObj(contentNum);
    push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
  });

  const objCount = 2 + pages.length * 3;
  const xrefStart = position;
  let xref = `xref\n0 ${objCount + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= objCount; n++) {
    xref += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  }
  push(xref);
  push(`trailer\n<< /Size ${objCount + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const c of chunks) {
    out.set(c, cursor);
    cursor += c.length;
  }
  return out;
}

/** Uint8Array → base64 (chunked so big scans don't blow the arg limit). */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
