"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { startCheckout, type State } from "../actions";

export function CheckoutButton() {
  // startCheckout redirects to the Stripe-hosted page on success, so a
  // returned state only ever carries an error.
  const [state, formAction, pending] = useActionState<State, FormData>(startCheckout, null);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      {state?.error && <Alert kind="error">{state.error}</Alert>}
      <Button type="submit" loading={pending}>
        {pending ? "Starting checkout" : "Checkout"}
      </Button>
    </form>
  );
}
