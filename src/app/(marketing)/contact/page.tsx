import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--org-primary)]">Contact</div>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Talk to sales</h1>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        We respond within one business day. Or just start a free account and kick the tires.
      </p>
      <form className="surface-raised mt-8 space-y-4 p-6" method="post" action="mailto:sales@flyingbluewhale.app">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-[var(--text-secondary)]">Name<input name="name" required className="input-base mt-1.5 w-full" /></label>
          <label className="text-xs font-medium text-[var(--text-secondary)]">Email<input name="email" type="email" required className="input-base mt-1.5 w-full" /></label>
        </div>
        <label className="block text-xs font-medium text-[var(--text-secondary)]">Company<input name="company" className="input-base mt-1.5 w-full" /></label>
        <label className="block text-xs font-medium text-[var(--text-secondary)]">How can we help?<textarea name="message" rows={4} className="input-base mt-1.5 w-full" /></label>
        <div className="flex items-center justify-end gap-2">
          <Button href="/signup" variant="secondary">Start free instead</Button>
          <Button type="submit">Send</Button>
        </div>
      </form>
    </div>
  );
}
