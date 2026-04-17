import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function PersonalSettings() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="surface mt-6 space-y-4 p-6">
        <div>
          <div className="text-sm font-semibold">Appearance</div>
          <div className="mt-3"><ThemeToggle /></div>
        </div>
        <div>
          <div className="text-sm font-semibold">Timezone</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">Auto-detected from browser. Override coming in v0.2.</div>
        </div>
        <div>
          <div className="text-sm font-semibold">Locale</div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">English (US). Additional locales on the roadmap.</div>
        </div>
      </div>
    </div>
  );
}
