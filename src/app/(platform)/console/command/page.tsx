import { ModuleHeader } from "@/components/Shell";
import { Command, Search, Keyboard, Zap, ArrowRight } from "lucide-react";

type ShortcutRow = { keys: string[]; description: string };
type ShortcutGroup = { label: string; shortcuts: ShortcutRow[] };

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: "Global",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
      { keys: ["Esc"], description: "Close dialog / dismiss" },
    ],
  },
  {
    label: "Navigation",
    shortcuts: [
      { keys: ["⌘", "B"], description: "Collapse / expand sidebar" },
      { keys: ["/"], description: "Focus sidebar search" },
    ],
  },
  {
    label: "Command Palette — Actions",
    shortcuts: [
      { keys: ["↑", "↓"], description: "Navigate results" },
      { keys: ["↵"], description: "Execute selected action" },
      { keys: ["⌘", "↵"], description: "Execute alternate action" },
      { keys: ["Esc"], description: "Close palette" },
    ],
  },
];

const PALETTE_GROUPS = [
  {
    icon: "🔍",
    label: "Navigate",
    description: "Jump to any section — projects, clients, finance, crew, marketplace, and more.",
  },
  {
    icon: "✦",
    label: "Create",
    description: "Quickly create a new project, invoice, client, expense, or lead from anywhere.",
  },
  {
    icon: "⚡",
    label: "Switch",
    description: "Switch between ATLVS console, GVTEWAY portal, and COMPVSS field PWA.",
  },
  {
    icon: "⚙",
    label: "Settings",
    description: "Toggle theme, open billing, manage org settings, or sign out.",
  },
  {
    icon: "⏱",
    label: "Recent",
    description: "Re-open the last pages you visited — no typing needed.",
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-[var(--border)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-secondary)]">
      {children}
    </kbd>
  );
}

export default function Page() {
  return (
    <>
      <ModuleHeader
        eyebrow="Console"
        title="Command Center"
        subtitle="Keyboard-driven navigation and actions"
      />
      <div className="page-content space-y-8">
        {/* Hero: Command Palette */}
        <div className="surface p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[var(--org-primary)] p-3 text-white shrink-0">
              <Command size={22} />
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-base font-semibold">Command Palette</h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-prose">
                Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> from anywhere in the console to open the command
                palette. Navigate, create records, switch shells, or change settings — all without
                lifting your hands from the keyboard.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1">
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </div>
                <ArrowRight size={12} className="text-[var(--text-muted)]" />
                <span className="text-xs text-[var(--text-muted)]">Opens command palette globally</span>
              </div>
            </div>
          </div>
        </div>

        {/* Palette action groups */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            What the palette can do
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PALETTE_GROUPS.map((g) => (
              <div key={g.label} className="surface p-4 flex gap-3">
                <span className="text-lg leading-none shrink-0">{g.icon}</span>
                <div>
                  <div className="text-sm font-medium">{g.label}</div>
                  <div className="mt-0.5 text-xs text-[var(--text-muted)] leading-snug">{g.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Keyboard shortcut reference */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Keyboard size={14} className="text-[var(--text-muted)]" />
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Keyboard shortcuts
            </h3>
            <span className="text-[10px] text-[var(--text-muted)]">— press ? anywhere to see live shortcuts</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.label} className="surface p-4">
                <div className="text-xs font-semibold text-[var(--text-secondary)] mb-3">{group.label}</div>
                <ul className="space-y-2">
                  {group.shortcuts.map((row, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <span className="text-xs text-[var(--text-primary)]">{row.description}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {row.keys.map((k, ki) => (
                          <Kbd key={ki}>{k}</Kbd>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={13} className="text-[var(--warning)]" />
            <span className="text-xs font-semibold">Pro tips</span>
          </div>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li className="flex gap-2">
              <span className="text-[var(--text-muted)] shrink-0">·</span>
              Type part of a page name — e.g. <code className="text-xs font-mono">"inv"</code> — to jump to Invoices instantly.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--text-muted)] shrink-0">·</span>
              The palette remembers your recent navigation. Hit <Kbd>⌘</Kbd><Kbd>K</Kbd> then <Kbd>↵</Kbd> to re-open your last page.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--text-muted)] shrink-0">·</span>
              Use <Kbd>⌘</Kbd><Kbd>↵</Kbd> on a navigation item to open it in a new tab.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--text-muted)] shrink-0">·</span>
              Search for <code className="text-xs font-mono">"new"</code> to see all quick-create actions at once.
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--text-muted)] shrink-0">·</span>
              The <Search size={10} className="inline" /> sidebar search (<Kbd>/</Kbd>) filters the left nav in real-time — great for dense orgs with many modules.
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
