/**
 * Client-side image downscaling for field capture.
 *
 * A modern phone camera produces 4-12 MB per frame. A crew member filing an
 * incident with four photos on venue LTE would be pushing ~40 MB uphill, on
 * battery, often on one bar — which is how "submit" becomes "spin forever,
 * then lose it". Downscaling in the browser first turns that into a few
 * hundred KB with no meaningful loss of evidentiary detail: 1600px on the
 * long edge still reads a serial number or a bruise.
 *
 * Deliberately best-effort. If anything in the canvas path fails (no
 * OffscreenCanvas, weird colour profile, a HEIC the browser won't decode),
 * we return the ORIGINAL file rather than blocking the submit. A big upload
 * beats a lost report.
 */

export const MAX_EDGE_PX = 1600;
export const JPEG_QUALITY = 0.82;

/** Cap on what we'll accept per photo AFTER downscale, as a backstop. */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });
}

/** iOS hands back HEIC when a photo comes from the library. */
export function isHeic(file: File): boolean {
  return /^image\/hei[cf]$/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/**
 * Downscale `file` so its longest edge is at most `maxEdge`, re-encoding as
 * JPEG. Images already under the cap are returned untouched — re-encoding a
 * small image only loses quality and gains nothing.
 *
 * HEIC is the exception on both counts, and both of this function's early
 * returns used to leak it through: a HEIC under the cap was returned as-is,
 * and — because HEIC is a more efficient codec than JPEG — a transcode is
 * frequently LARGER than the original, so the "did it help?" check handed the
 * HEIC back even for oversized images. Either way the bytes reached storage
 * still HEIC, and nothing on the reviewing end can decode them: the upload
 * routes accept image/heic, but no console surface, no <img>, and no PDF
 * export can render it. An accepted HEIC was evidence nobody could open.
 *
 * So HEIC is always transcoded, regardless of size or byte win. A slightly
 * bigger JPEG that a reviewer can actually see beats a smaller file that
 * nobody can. Safari can decode HEIC natively — which is exactly where HEIC
 * comes from — so the conversion happens on the one device guaranteed to have
 * a decoder. Elsewhere (Chrome has none) `loadImage` throws and we fall back
 * to the original bytes, because a file we can't convert is still evidence.
 */
export async function downscaleImage(file: File, maxEdge = MAX_EDGE_PX): Promise<File> {
  if (!file.type.startsWith("image/") && !isHeic(file)) return file;
  const heic = isHeic(file);

  try {
    const img = await loadImage(file);
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (longest <= maxEdge && !heic) return file;

    // A HEIC under the cap still needs re-encoding, just not shrinking.
    const scale = Math.min(1, maxEdge / longest);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) return file;

    // Only take the downscaled version if it actually helped — unless the
    // point was the format, not the size.
    if (!heic && blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    // Best-effort: never block a field submit on an image optimisation.
    return file;
  }
}

/** Downscale a batch, preserving order. */
export async function downscaleAll(files: File[], maxEdge = MAX_EDGE_PX): Promise<File[]> {
  return Promise.all(files.map((f) => downscaleImage(f, maxEdge)));
}
