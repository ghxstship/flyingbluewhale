"use client";

import { useState } from "react";
import { FormShell, type FormState } from "@/components/FormShell";
import { FormField, TextInput, TextArea } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { OfferLetterStatus } from "@/lib/offer-letters/types";
import { acceptOffer, declineOffer } from "./actions";

export function ResponseForms({
  token,
  status,
  recipientName,
}: {
  token: string;
  status: OfferLetterStatus;
  recipientName: string;
}) {
  const [mode, setMode] = useState<"choose" | "accept" | "decline" | "done">(
    status === "accepted" || status === "declined" ? "done" : "choose",
  );

  if (status === "accepted") {
    return (
      <Alert kind="success">You signed this letter. A copy was sent to your team and is on file with GHXSTSHIP.</Alert>
    );
  }
  if (status === "declined") {
    return <Alert kind="info">You declined this offer. Reach out if anything changes.</Alert>;
  }
  if (status === "withdrawn" || status === "expired") {
    return <Alert kind="warning">This letter is no longer active. Contact production to request an update.</Alert>;
  }

  if (mode === "choose") {
    return (
      <section className="surface space-y-3 p-6">
        <h3 className="text-sm font-semibold tracking-wider uppercase">Your Response</h3>
        <p className="text-sm text-[var(--p-text-2)]">
          Review the letter above. When you&apos;re ready, accept with a typed signature or decline with a brief reason.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setMode("accept")}>Accept and Sign</Button>
          <Button variant="secondary" onClick={() => setMode("decline")}>
            Decline
          </Button>
        </div>
      </section>
    );
  }

  if (mode === "accept") {
    return <AcceptForm token={token} defaultName={recipientName} onCancel={() => setMode("choose")} />;
  }

  return <DeclineForm token={token} onCancel={() => setMode("choose")} />;
}

function AcceptForm({ token, defaultName, onCancel }: { token: string; defaultName: string; onCancel: () => void }) {
  const action = async (prev: FormState, fd: FormData) => {
    return (await acceptOffer(token, prev as never, fd)) as FormState;
  };
  return (
    <section className="surface space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase">Accept and Sign</h3>
          <p className="text-sm text-[var(--p-text-2)]">
            Type your full legal name to accept this engagement. Your typed signature, IP address, and timestamp are
            recorded as evidence of agreement.
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <FormShell action={action} submitLabel="Sign and Accept" className="space-y-4">
        <FormField name="signature" label="Typed Signature · Full Legal Name" required>
          <TextInput
            name="signature"
            defaultValue={defaultName}
            className="ps-input focus-ring font-subdisplay text-2xl tracking-wide"
          />
        </FormField>
      </FormShell>
    </section>
  );
}

function DeclineForm({ token, onCancel }: { token: string; onCancel: () => void }) {
  const action = async (prev: FormState, fd: FormData) => {
    return (await declineOffer(token, prev as never, fd)) as FormState;
  };
  return (
    <section className="surface space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase">Decline This Offer</h3>
          <p className="text-sm text-[var(--p-text-2)]">
            Share a brief reason so production can follow up if anything changes.
          </p>
        </div>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <FormShell action={action} submitLabel="Decline Letter" className="space-y-4">
        <FormField name="reason" label="Reason" required>
          <TextArea name="reason" rows={3} placeholder="e.g. Calendar conflict — already booked May 14–18." />
        </FormField>
      </FormShell>
    </section>
  );
}
