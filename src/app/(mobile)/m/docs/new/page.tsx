import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { uploadPersonalDoc } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewDocPage() {
  if (!hasSupabase) return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  await requireSession();

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-semibold">Upload Document</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Only you can see these. The file is uploaded to a private bucket and downloadable via a short-lived signed URL.
      </p>

      <form action={uploadPersonalDoc} encType="multipart/form-data" className="mt-5 space-y-4">
        <label className="block text-xs font-semibold">
          Label
          <input
            type="text"
            name="label"
            required
            maxLength={200}
            placeholder="e.g. Driver's License"
            className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold">
          Kind
          <select
            name="doc_kind"
            required
            className="mt-1 w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm"
            defaultValue="id"
          >
            <option value="id">ID</option>
            <option value="license">License / certification</option>
            <option value="tax">Tax form</option>
            <option value="contract">Contract</option>
            <option value="medical">Medical</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block text-xs font-semibold">
          File
          <input type="file" name="file" required accept="image/*,.pdf,.doc,.docx" className="mt-1 w-full text-sm" />
        </label>
        <Button type="submit" className="w-full">Upload</Button>
      </form>
    </div>
  );
}
