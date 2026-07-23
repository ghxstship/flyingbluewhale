"use server";

import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
import {
  markOfferLetterSent,
  rotateAccessCode,
  updateOfferLetter,
  withdrawOfferLetter,
} from "@/lib/offer-letters/mutations";
import { getOfferLetter } from "@/lib/offer-letters/queries";
import { getActiveMsaForCrew } from "@/lib/msa/queries";
import type { CompensationBasis, OfferLetterClassification, OfferLetterEmployer } from "@/lib/offer-letters/types";
import { actionErrorMessage } from "@/lib/errors";

export type State = { error?: string; ok?: true } | null;

export async function saveLetter(id: string, _prev: State, fd: FormData): Promise<State> {
  try {
    const session = await requireSession();
    // Offer letters bind the org legally — manager+ only. Lower personas
    // (crew/viewer/community) should never edit compensation, classification,
    // or engagement dates even if RLS lets them through.
    if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.edit-offer-letters", "Only manager+ can edit offer letters") };
    const extraInclusionsRaw = (fd.get("extra_inclusions") as string | null) ?? "";
    const extraInclusions = extraInclusionsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const overrideAmountDollarsRaw = fd.get("override_amount_dollars") as string | null;
    const overridePerDiemDollarsRaw = fd.get("override_per_diem_dollars") as string | null;
    const overrideAmountCents =
      overrideAmountDollarsRaw && overrideAmountDollarsRaw.trim() !== ""
        ? Math.round(Number(overrideAmountDollarsRaw) * 100)
        : null;
    const overridePerDiemCents =
      overridePerDiemDollarsRaw && overridePerDiemDollarsRaw.trim() !== ""
        ? Math.round(Number(overridePerDiemDollarsRaw) * 100)
        : null;

    await updateOfferLetter(session.orgId, id, {
      crew_member_id: requireString(fd.get("crew_member_id"), "Recipient is required"),
      role_id: requireString(fd.get("role_id"), "Role is required"),
      reports_to_crew_member_id: optionalString(fd.get("reports_to_crew_member_id")),
      venue_id: optionalString(fd.get("venue_id")),
      employer: (fd.get("employer") as OfferLetterEmployer) ?? "ghxstship",
      classification: (fd.get("classification") as OfferLetterClassification) ?? "1099",
      rate_card_item_id: optionalString(fd.get("rate_card_item_id")),
      per_diem_rate_card_item_id: optionalString(fd.get("per_diem_rate_card_item_id")),
      compensation_basis: (fd.get("compensation_basis") as CompensationBasis) ?? "per_day",
      override_amount_cents: overrideAmountCents,
      override_per_diem_cents: overridePerDiemCents,
      travel_in_date: optionalString(fd.get("travel_in_date")),
      onsite_start_date: optionalString(fd.get("onsite_start_date")),
      onsite_end_date: optionalString(fd.get("onsite_end_date")),
      travel_out_date: optionalString(fd.get("travel_out_date")),
      travel_provided: triState(fd.get("travel_provided")),
      lodging_provided: triState(fd.get("lodging_provided")),
      meals_provided: triState(fd.get("meals_provided")),
      extra_inclusions: extraInclusions,
      expectations_override: optionalString(fd.get("expectations_override")),
      terms_override: optionalString(fd.get("terms_override")),
    });
    revalidatePath(`/studio/people/offer-letters/${id}`);
    revalidatePath(`/studio/people/offer-letters`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save" };
  }
}

export async function sendLetter(id: string, _prev: State, _fd: FormData): Promise<State> {
  try {
    const session = await requireSession();
    if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.send-offer-letters", "Only manager+ can send offer letters") };
    // Gate: contractor must have an Independent Contractor MSA on file (any
    // non-revoked, non-superseded state — signed, pending, or in-review).
    // The MSA carries the Nevada IC compliance language; sending an offer
    // letter without one leaves the engagement without its legal frame.
    const letterData = await getOfferLetter(session.orgId, id);
    if (!letterData) return { error: actionErrorMessage("not-found.offer-letter", "Offer letter not found") };
    const activeMsa = await getActiveMsaForCrew(letterData.raw.crew_member_id);
    if (!activeMsa) {
      return {
        error:
          "No Master Services Agreement on file for this contractor. Issue an MSA at /studio/people/msas/new before sending this letter.",
      };
    }
    await markOfferLetterSent(session.orgId, id, session.email);
    revalidatePath(`/studio/people/offer-letters/${id}`);
    revalidatePath(`/studio/people/offer-letters`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to mark sent" };
  }
}

export async function withdrawLetter(id: string, _prev: State, _fd: FormData): Promise<State> {
  try {
    const session = await requireSession();
    if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.withdraw-offer-letters", "Only manager+ can withdraw offer letters") };
    await withdrawOfferLetter(session.orgId, id, session.email);
    revalidatePath(`/studio/people/offer-letters/${id}`);
    revalidatePath(`/studio/people/offer-letters`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to withdraw" };
  }
}

export async function rotateLetterCode(id: string, _prev: State, _fd: FormData): Promise<State> {
  try {
    const session = await requireSession();
    if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.rotate-letter-access-codes", "Only manager+ can rotate letter access codes") };
    await rotateAccessCode(session.orgId, id, session.email);
    revalidatePath(`/studio/people/offer-letters/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to rotate code" };
  }
}

function requireString(v: FormDataEntryValue | null, msg: string): string {
  if (!v) throw new Error(msg);
  const s = String(v).trim();
  if (!s) throw new Error(msg);
  return s;
}

function optionalString(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

/** Tri-state checkbox: "true" | "false" | "" (inherit / null) */
function triState(v: FormDataEntryValue | null): boolean | null {
  if (v === null) return null;
  const s = String(v);
  if (s === "true") return true;
  if (s === "false") return false;
  return null;
}
