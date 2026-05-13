"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getMsaByToken, recordMsaView } from "@/lib/msa/queries";
import { signMsaByToken } from "@/lib/msa/mutations";
import type { ExhibitBOtherClient, ExhibitCCapitalItem } from "@/lib/msa/types";

export type State = { error?: string; ok?: true } | null;

function cookieName(token: string) {
  return `msa_${token}`;
}

export async function unlockMsa(token: string, _prev: State, fd: FormData): Promise<State> {
  const code = String(fd.get("access_code") ?? "")
    .trim()
    .toUpperCase();
  if (code.length !== 6) return { error: "Enter the 6-character access code." };
  const msa = await getMsaByToken(token, code);
  if (!msa) return { error: "Invalid token or access code, or this MSA has been revoked." };
  const c = await cookies();
  c.set(cookieName(token), code, {
    httpOnly: true,
    sameSite: "lax",
    path: `/msa/${token}`,
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  await recordMsaView(token, code);
  redirect(`/msa/${token}`);
}

export async function signMsa(token: string, _prev: State, fd: FormData): Promise<State> {
  const c = await cookies();
  const code = c.get(cookieName(token))?.value;
  if (!code) return { error: "Session expired. Re-enter your access code." };

  const signature = String(fd.get("signature") ?? "").trim();
  if (signature.length < 2) return { error: "Type your full legal name to sign." };

  // Parse Exhibit B (rows of client/project/dates) and Exhibit C (label/description)
  // from form fields named `exhibit_b_<i>_<key>` and `exhibit_c_<i>_<key>`.
  const exhibitB = collectExhibit<ExhibitBOtherClient>(fd, "exhibit_b", ["client", "project", "dates"]);
  const exhibitC = collectExhibit<ExhibitCCapitalItem>(fd, "exhibit_c", ["label", "description"]);

  const nscbLicense = trimOrNull(fd.get("nscb_license"));
  const nscbClassification = trimOrNull(fd.get("nscb_classification"));
  const nscbLimit = String(fd.get("nscb_monetary_limit_cents") ?? "").trim();
  const nscbLimitCents = nscbLimit ? Math.max(0, Math.round(Number(nscbLimit))) : null;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = h.get("user-agent");

  try {
    await signMsaByToken(
      token,
      code,
      signature,
      exhibitB,
      exhibitC,
      { license: nscbLicense, classification: nscbClassification, monetaryLimitCents: nscbLimitCents },
      ip,
      ua,
    );
    revalidatePath(`/msa/${token}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not sign the MSA." };
  }
}

function trimOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function collectExhibit<T extends Record<string, string>>(fd: FormData, prefix: string, keys: readonly string[]): T[] {
  const rows: T[] = [];
  // Scan up to 10 rows; admin UIs typically expose 3-5.
  for (let i = 0; i < 10; i++) {
    const row: Record<string, string> = {};
    let hasAny = false;
    for (const k of keys) {
      const v = String(fd.get(`${prefix}_${i}_${k}`) ?? "").trim();
      if (v) hasAny = true;
      row[k] = v;
    }
    if (hasAny) rows.push(row as T);
  }
  return rows;
}
