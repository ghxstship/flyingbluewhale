import "server-only";

import archiver from "archiver";

/**
 * ZIP strategy — Opportunity #8 (part C) + #9 project archive scaffold.
 *
 * `rowsToZipBuffer` accepts one-or-many file entries and returns a
 * Buffer. Callers compose whatever file set they want (e.g. a per-table
 * CSV + JSON + a cover manifest.json). #9 Project Archive reuses this
 * with a richer entry list.
 */

export type ZipEntry = { name: string; content: Buffer | string };

export async function rowsToZipBuffer(entries: ZipEntry[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    archive.on("data", (c) => chunks.push(Buffer.from(c)));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);
    archive.on("warning", (err) => {
      if (err.code !== "ENOENT") reject(err);
    });

    for (const e of entries) {
      archive.append(e.content, { name: e.name });
    }
    archive.finalize();
  });
}
