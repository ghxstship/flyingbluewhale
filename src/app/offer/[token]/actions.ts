"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  acceptOfferLetterByToken,
  declineOfferLetterByToken,
  getOfferLetterByToken,
  recordOfferLetterView,
} from "@/lib/offer-letters/queries";

export type State = { error?: string; ok?: true } | null;

export async function unlockOffer(token: string, _prev: State, fd: FormData): Promise<State> {
  const code = String(fd.get("access_code") ?? "")
    .trim()
    .toUpperCase();
  if (code.length !== 6) {
    return { error: "Enter the 6-character access code." };
  }
  const letter = await getOfferLetterByToken(token, code);
  if (!letter) {
    return { error: "Invalid token or access code, or letter has been withdrawn." };
  }
  const c = await cookies();
  c.set(cookieName(token), code, {
    httpOnly: true,
    sameSite: "lax",
    path: `/offer/${token}`,
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });
  await recordOfferLetterView(token, code);
  redirect(`/offer/${token}`);
}

export async function lockOffer(token: string): Promise<void> {
  const c = await cookies();
  c.set(cookieName(token), "", {
    path: `/offer/${token}`,
    maxAge: 0,
  });
  redirect(`/offer/${token}`);
}

export async function acceptOffer(token: string, _prev: State, fd: FormData): Promise<State> {
  const c = await cookies();
  const code = c.get(cookieName(token))?.value;
  if (!code) return { error: "Session expired. Re-enter your access code." };
  const signature = String(fd.get("signature") ?? "").trim();
  if (signature.length < 2) return { error: "Type your full legal name to sign." };
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const ua = h.get("user-agent");
  try {
    await acceptOfferLetterByToken(token, code, signature, ip, ua);
    revalidatePath(`/offer/${token}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not accept the offer." };
  }
}

export async function declineOffer(token: string, _prev: State, fd: FormData): Promise<State> {
  const c = await cookies();
  const code = c.get(cookieName(token))?.value;
  if (!code) return { error: "Session expired. Re-enter your access code." };
  const reason = String(fd.get("reason") ?? "").trim();
  if (reason.length < 4) return { error: "Please share a brief reason." };
  try {
    await declineOfferLetterByToken(token, code, reason);
    revalidatePath(`/offer/${token}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not decline the offer." };
  }
}

function cookieName(token: string) {
  return `offer_${token}`;
}
