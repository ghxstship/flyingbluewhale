/**
 * Serialise kit `FormScreen` values into FormData.
 *
 * Every mobile form page hand-rolled this loop, and every one of them did
 * `fd.set(k, String(val))` — which is fine for text and booleans and
 * catastrophic for a File: it becomes the literal string "[object File]".
 * That is precisely how the incident form could report "3 photos added"
 * while the server action received nothing to upload.
 *
 * One helper, so the File branch exists exactly once.
 */
export function toFormData(vals: Record<string, unknown>): FormData {
  const fd = new FormData();
  for (const [k, val] of Object.entries(vals)) {
    if (val == null) continue;

    // Multi-file fields append repeated keys; read them back server-side
    // with `fd.getAll(key)` (see `filesFrom` in lib/mobile/photo-upload).
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item instanceof File) fd.append(k, item);
        else if (item != null) fd.append(k, String(item));
      }
      continue;
    }

    if (val instanceof File) {
      fd.append(k, val);
      continue;
    }

    // The avatar field carries { file, zoom, pos } — send the pixels.
    if (typeof val === "object" && val !== null && "file" in val && (val as { file: unknown }).file instanceof File) {
      fd.append(k, (val as { file: File }).file);
      continue;
    }

    fd.set(k, typeof val === "boolean" ? (val ? "1" : "") : String(val));
  }
  return fd;
}
