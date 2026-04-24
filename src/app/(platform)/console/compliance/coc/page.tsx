import { ModuleHeader } from "@/components/Shell";

export default function Page() {
  return (
    <>
      <ModuleHeader eyebrow="Console" title="Chain of custody" />
      <div className="page-content">
        <div className="surface p-6 text-sm text-[var(--muted)] max-w-2xl">Sample and evidence tracking — COC entries captured via /m/coc.</div>
      </div>
    </>
  );
}
