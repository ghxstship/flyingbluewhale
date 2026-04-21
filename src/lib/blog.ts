export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  author: string;
  blurb: string;
  keywords: string[];
  readingTime: string;
  body: Array<
    | { kind: "p"; text: string }
    | { kind: "h2"; text: string }
    | { kind: "h3"; text: string }
    | { kind: "ul"; items: string[] }
    | { kind: "ol"; items: string[] }
    | { kind: "quote"; text: string; cite?: string }
    | { kind: "code"; lang?: string; text: string }
  >;
};

export const POSTS: Record<string, BlogPost> = {
  launch: {
    slug: "launch",
    title: "Launching the suite: three shells, one database, zero spreadsheets",
    date: "2026-04-16",
    author: "Second Star Technologies team",
    blurb:
      "Why we consolidated a decade of production duct tape into a single platform — and the architectural decisions that made it possible.",
    keywords: [
      "ATLVS launch",
      "GVTEWAY launch",
      "COMPVSS launch",
      "event production platform",
      "production operations software",
      "three-shell architecture",
      "RLS multi-tenant",
    ],
    readingTime: "8 min read",
    body: [
      { kind: "p", text: "Every production team we've worked with was running the same stack: Asana for tasks, Notion for the wiki, Google Sheets for budgets, DocuSign for proposals, Eventbrite or Ticket Tailor for tickets, a clipboard at the gate, a group text for the crew, and a prayer that nothing fell through the seams. It usually did." },
      { kind: "p", text: "The Second Star Technologies suite is the consolidation of a decade of that duct tape. Today we're launching the three-shell GA: ATLVS for internal ops, GVTEWAY for external stakeholders, COMPVSS for the field. One database. One identity. One set of RLS rules." },

      { kind: "h2", text: "Why three shells, not three apps" },
      { kind: "p", text: "The single biggest architectural decision was to treat ATLVS, GVTEWAY, and COMPVSS as three route groups inside one Next.js app, not three separate deployments. It is one Supabase project, one schema, one auth, one set of policies. The shells differ only in layout, nav, and a data-platform attribute that swaps the accent color and OG image." },
      { kind: "p", text: "What this buys us: no cross-app API contracts to version, no cross-app auth dance, no reconciling 'the truth' between three databases. A row in projects is the same row whether an admin reads it in ATLVS, a client sees it via GVTEWAY, or a crew member scans against it in COMPVSS." },

      { kind: "h2", text: "RLS on every table, no exceptions" },
      { kind: "p", text: "Every one of our 33+ tables has Row-Level Security enabled with policies gated on is_org_member(org_id) and has_org_role(org_id, roles[]). There is no application code path that can return a row belonging to another org — because the database itself won't let it." },
      { kind: "p", text: "The reason this matters: when someone leaves your company and you revoke their membership, access dies the next request. No cache invalidation. No permission propagation. No 'we forgot to remove them from the mailing list.' RLS is not a feature. It is the authorization model." },

      { kind: "h2", text: "GVTEWAY: the slug is the authorization boundary" },
      { kind: "p", text: "External stakeholders don't sign up. They open a URL. /p/[slug]/client opens the client proposal. /p/[slug]/vendor opens the vendor rail. /p/[slug]/guest opens the guest guide. The slug is the grant — rotate it, access dies globally." },
      { kind: "p", text: "Two vendors on the same project cannot see each other's pricing. RLS enforces it at the database. It is not possible to bypass by guessing a URL." },

      { kind: "h2", text: "COMPVSS: offline-first is a production requirement" },
      { kind: "p", text: "Venues kill signal. A mobile scanner that doesn't work when the cell tower is saturated is not a scanner — it's a lanyard. COMPVSS's service worker caches the scanner shell and today's data. Scans queue locally in IndexedDB and replay in order when the network returns." },
      { kind: "p", text: "And it's a PWA. No App Store review, no build pipeline, no install fragmentation. Your crew opens a URL, taps Add to Home Screen, and they have a full-screen launcher indistinguishable from native." },

      { kind: "h2", text: "What we cut" },
      { kind: "p", text: "We said no to a lot. No per-seat pricing (per org, not per seat). No per-scan surcharges (scan as many as your event needs). No fake 'enterprise only' gates on features that should be standard (audit log, RLS, signed URLs, HMAC webhooks — all tiers). No forced sales call to try the product (sign up; you're in)." },

      { kind: "h2", text: "What's next" },
      { kind: "p", text: "Next on the roadmap: direct QuickBooks Online sync, redlineable proposals, iOS Live Activity for scan counts, and SOC-2 Type II certification. The full changelog lives at /changelog and is updated the day each change ships." },
      { kind: "p", text: "Start free at /signup. We'll see you at load-in." },
    ],
  },

  "boarding-pass": {
    slug: "boarding-pass",
    title: "KBYG, role-scoped: the Boarding Pass pattern, now native",
    date: "2026-04-10",
    author: "Second Star Technologies team",
    blurb:
      "We integrated the Boarding Pass Know-Before-You-Go pattern from Black Coffee's tour into the platform. Here's how it works — and why a PDF can't do this.",
    keywords: [
      "boarding pass KBYG",
      "know before you go",
      "event guide software",
      "role-scoped event information",
      "event CMS",
    ],
    readingTime: "6 min read",
    body: [
      { kind: "p", text: "When Black Coffee's team published their interactive KBYG for the 2025 North American tour, it did something every production team has tried and failed to do with a PDF: it gave each persona exactly the information they needed, scoped to their role, and let the production team update it the morning of the show." },
      { kind: "p", text: "We liked it enough to copy the pattern into the platform. Event guides are now a first-class module in ATLVS, rendered on both GVTEWAY (portal) and COMPVSS (mobile) with one schema and zero duplication." },

      { kind: "h2", text: "The problem with PDF KBYG" },
      { kind: "p", text: "A PDF can't be scoped by role. A guest and a production carpenter see the same document. So you either write one bloated PDF that confuses the guest with SOPs and PPE they don't need, or you write three PDFs and try to keep them in sync." },
      { kind: "p", text: "A PDF also can't be updated at 9am on show day when the weather changes the load-in schedule. You can generate a new PDF, rename it, re-upload it to a link — and hope every stakeholder refreshes from the new one. They won't." },

      { kind: "h2", text: "One schema, six persona renders" },
      { kind: "p", text: "An event guide is a single row in event_guides per project × persona. The JSONB config column holds a typed list of sections: overview, schedule, set_times, timeline, credentials, contacts, faq, sops, ppe, radio, resources, evacuation, fire_safety, accessibility, sustainability, code_of_conduct, or custom." },
      { kind: "p", text: "In ATLVS CMS, you author one canonical guide. In the portal (GVTEWAY) and mobile (COMPVSS), a single <GuideView> component renders the sections that viewer's persona is entitled to see. A guest sees parking, schedule, FAQ. Crew sees radio channels, SOPs, PPE. Same data, filtered view." },

      { kind: "h2", text: "Public guides readable by anon" },
      { kind: "p", text: "Guests shouldn't need to sign up to read the KBYG. We added an RLS policy — event_guides_select_public — that lets anon read guides where status='published'. That's it. No link obfuscation, no anon token, no secret URL. The guide is public because it's supposed to be public, and the database enforces that cleanly." },

      { kind: "h2", text: "What we kept from the Boarding Pass original" },
      { kind: "ul", items: [
        "Tier 1–5 classification banners for venue zones",
        "Role-based timeline views (artist vs. crew vs. security)",
        "Radio channel allocations surfaced per persona",
        "Offline-accessible on the crew phone via COMPVSS service worker",
      ] },

      { kind: "h2", text: "What we added" },
      { kind: "ul", items: [
        "CMS editor with draft → preview → publish flow",
        "Version history — roll back any publish from ATLVS",
        "Server-rendered PDF export for the handful of stakeholders who still print it",
        "Branded per project — logo, accent color, hero imagery overlay --org-primary",
      ] },

      { kind: "h2", text: "Start using it" },
      { kind: "p", text: "Event guides are live on the Professional tier and above. Open any project in ATLVS, tap Guides, pick a persona, and you're in the editor. Read the full how-to at /guides/what-is-kbyg." },
    ],
  },

  "ai-assistant": {
    slug: "ai-assistant",
    title: "Streaming Claude in the console: the AI assistant, grounded in your workspace",
    date: "2026-04-01",
    author: "Second Star Technologies team",
    blurb:
      "We wired Claude Sonnet 4.6 and Opus 4.7 directly into ATLVS. Streaming responses, persistent history, RLS-scoped tool use.",
    keywords: [
      "Claude AI production",
      "AI for event production",
      "streaming AI assistant",
      "Anthropic SDK",
      "RLS-scoped AI",
    ],
    readingTime: "7 min read",
    body: [
      { kind: "p", text: "The AI assistant shipped with three design constraints we weren't willing to negotiate: streaming (responses appear token-by-token, not in a 15-second block), grounded (it can only see your org's data, enforced by RLS), and auditable (every conversation persists to Postgres with model, token count, and cost)." },
      { kind: "p", text: "We picked Claude because the Sonnet 4.6 → Opus 4.7 range maps cleanly to 'fast and cheap' vs. 'deep reasoning' — and the Anthropic SDK streaming transport is the cleanest we've used." },

      { kind: "h2", text: "Streaming via SSE" },
      { kind: "p", text: "The route at /api/v1/ai/chat holds open an SSE connection and forwards Anthropic's streaming deltas straight to the client. Perceived latency on a short prompt is under 500ms. On a multi-thousand-token response, the first token still appears in that window — the remaining tokens arrive as they're generated." },

      { kind: "h2", text: "Persistence: ai_conversations and ai_messages" },
      { kind: "p", text: "Every conversation lives in two RLS-scoped tables. Switching between conversations is instant. Conversation forking is on the roadmap." },
      { kind: "code", lang: "sql", text: "create table ai_conversations (\n  id uuid primary key default gen_random_uuid(),\n  org_id uuid not null references orgs(id),\n  user_id uuid not null references auth.users(id),\n  title text,\n  model text not null default 'claude-sonnet-4-6',\n  created_at timestamptz not null default now()\n);\n-- RLS: select/insert/update/delete where is_org_member(org_id)" },

      { kind: "h2", text: "Grounded in your org, not leaked across tenants" },
      { kind: "p", text: "The assistant can call tools that read production data. Every one of those tools runs under the requesting user's session. RLS applies. Even if the model tried to return another org's data, Postgres would return zero rows. This is not 'fine-tuning our prompt to be careful.' It's the database saying no." },

      { kind: "h2", text: "Drafting templates" },
      { kind: "p", text: "The common workflows don't need a chat — they need a form. We shipped drafting templates for advancing emails, vendor RFPs, incident summary reports, and production schedules. Pick a project, click the template, and Claude drafts from the actual data: show dates, crew, vendors, schedule." },

      { kind: "h2", text: "Rate limits + costs" },
      { kind: "p", text: "/api/v1/ai/* is behind the ai rate bucket in middleware — no runaway costs, no abuse. Every message writes to audit_log with the model, token count, and estimated cost. Professional includes 200K tokens/month; Enterprise is custom." },

      { kind: "h2", text: "What it's not" },
      { kind: "p", text: "It's not a replacement for your producer. It's a leverage tool for the producer you already have. Use it to draft, summarize, surface, reconcile — not to decide. The AI will cheerfully hallucinate a vendor contact if you let it. Always check." },

      { kind: "h2", text: "Model switching" },
      { kind: "p", text: "Toggle Sonnet 4.6 (fast, cheap, great at draft + classify) vs. Opus 4.7 (deep reasoning, proposal drafting, contract review) per conversation. Opus is Enterprise-only today; it'll open up to Professional in a future release as price comes down." },
    ],
  },
};

export const POST_LIST = Object.values(POSTS).sort((a, b) => b.date.localeCompare(a.date));
