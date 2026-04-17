// Boarding-Pass style event guide schema.
// Each guide is a per-role KBYG rendered from JSON stored in event_guides.config.

export type GuidePersona = "artist" | "vendor" | "client" | "sponsor" | "guest" | "crew" | "staff" | "custom";

export type GuideSection =
  | { type: "overview"; heading: string; body: string; callouts?: { kind: "pink" | "gold" | "red"; title?: string; body: string }[] }
  | { type: "schedule"; heading: string; entries: { time: string; activity: string; location?: string; note?: string }[] }
  | { type: "set_times"; heading: string; entries: { artist: string; stage?: string; start: string; end: string }[] }
  | { type: "timeline"; heading: string; entries: { time: string; activity: string; note?: string }[] }
  | { type: "credentials"; heading: string; rows: { area: string; access: Record<string, boolean | string> }[]; columns: string[]; highlightRowIndex?: number }
  | { type: "contacts"; heading: string; entries: { header?: string; role?: string; name?: string; phone?: string; email?: string }[] }
  | { type: "faq"; heading: string; entries: { q: string; a: string }[] }
  | { type: "sops"; heading: string; entries: { code?: string; title: string; steps: string[]; note?: string }[] }
  | { type: "ppe"; heading: string; entries: { item: string; required: boolean; note?: string }[] }
  | { type: "radio"; heading: string; channels: { channel: string; purpose: string }[]; codeWords?: { code: string; meaning: string }[] }
  | { type: "resources"; heading: string; entries: { name: string; location: string; details?: string }[] }
  | { type: "evacuation"; heading: string; routes: { from: string; to: string; via?: string }[]; assemblyPoint?: string }
  | { type: "fire_safety"; heading: string; entries: { item: string; location: string; note?: string }[] }
  | { type: "accessibility"; heading: string; entries: { item: string; detail?: string }[] }
  | { type: "sustainability"; heading: string; entries: { item: string; detail?: string }[] }
  | { type: "code_of_conduct"; heading: string; entries: { item: string; detail?: string }[] }
  | { type: "custom"; heading: string; body: string };

export type GuideConfig = {
  pageTitles?: string[];
  heroImage?: string;
  accentColor?: string;
  sections: GuideSection[];
};
