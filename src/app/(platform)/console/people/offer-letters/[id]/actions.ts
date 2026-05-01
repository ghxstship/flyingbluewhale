"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  markOfferLetterSent,
  rotateAccessCode,
  updateOfferLetter,
  withdrawOfferLetter,
} from "@/lib/offer-letters/mutations";
import type { CompensationBasis, OfferLetterClassification, OfferLetterEmployer } from "@/lib/offer-letters/types";

export type State = { error?: string; ok?: true } | null;

export async function saveLetter(id: string, _prev: State, fd: FormData): Promise<State> {
  try {
    const session = await requireSession();
    const inclusionsRaw = (fd.get("inclusions") as string | null) ?? "";
    const inclusions = inclusionsRaw
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const compensationDollars = Number(fd.get("compensation_dollars") ?? 0);
    const perDiemDollars = Number(fd.get("per_diem_dollars") ?? 0);

    await updateOfferLetter(session.orgId, id, {
      recipient_name: String(fd.get("recipient_name") ?? "").trim(),
      recipient_email: String(fd.get("recipient_email") ?? "").trim(),
      recipient_phone: optional(fd.get("recipient_phone")),
      role_title: String(fd.get("role_title") ?? "").trim(),
      department: optional(fd.get("department")),
      employer: (fd.get("employer") as OfferLetterEmployer) ?? "ghxstship",
      classification: (fd.get("classification") as OfferLetterClassification) ?? "1099",
      reports_to_name: optional(fd.get("reports_to_name")),
      reports_to_email: optional(fd.get("reports_to_email")),
      work_location: optional(fd.get("work_location")),
      engagement_start: optional(fd.get("engagement_start")),
      engagement_end: optional(fd.get("engagement_end")),
      compensation_cents: Math.round(compensationDollars * 100),
      compensation_basis: (fd.get("compensation_basis") as CompensationBasis) ?? "flat_fee",
      compensation_label: optional(fd.get("compensation_label")),
      payment_schedule: optional(fd.get("payment_schedule")),
      per_diem_cents: Math.round(perDiemDollars * 100),
      travel_provided: fd.get("travel_provided") === "on",
      lodging_provided: fd.get("lodging_provided") === "on",
      meals_provided: fd.get("meals_provided") === "on",
      inclusions,
      expectations: optional(fd.get("expectations")),
      terms: optional(fd.get("terms")),
      governing_law: String(fd.get("governing_law") ?? "State of Florida"),
      confidentiality: fd.get("confidentiality") === "on",
    });
    revalidatePath(`/console/people/offer-letters/${id}`);
    revalidatePath(`/console/people/offer-letters`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save" };
  }
}

export async function sendLetter(id: string, _prev: State, _fd: FormData): Promise<State> {
  try {
    const session = await requireSession();
    await markOfferLetterSent(session.orgId, id, session.email);
    revalidatePath(`/console/people/offer-letters/${id}`);
    revalidatePath(`/console/people/offer-letters`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to mark sent" };
  }
}

export async function withdrawLetter(id: string, _prev: State, _fd: FormData): Promise<State> {
  try {
    const session = await requireSession();
    await withdrawOfferLetter(session.orgId, id, session.email);
    revalidatePath(`/console/people/offer-letters/${id}`);
    revalidatePath(`/console/people/offer-letters`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to withdraw" };
  }
}

export async function rotateLetterCode(id: string, _prev: State, _fd: FormData): Promise<State> {
  try {
    const session = await requireSession();
    await rotateAccessCode(session.orgId, id, session.email);
    revalidatePath(`/console/people/offer-letters/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to rotate code" };
  }
}

function optional(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}
