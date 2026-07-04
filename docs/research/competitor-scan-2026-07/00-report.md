# Competitive Scan — July 2026

**Date:** 2026-07-04
**Method:** multi-angle web research (5 search angles, 25+ primary sources fetched, every claim adversarially verified 3-vote against its primary source; the workforce/marketplace/LMS categories re-verified in a second targeted pass). Facts below are feature-existence claims backed by vendor press releases, changelogs, or help-center docs — vendor-reported efficacy numbers are flagged as such.
**Companions:** [01-delta-plan.md](01-delta-plan.md) (what we do about it) · prior programs: `docs/COMPETITIVE_PARITY_IMPLEMENTATION_PLAN.md` (SmartSuite/ClickUp, 2026-06-13), `docs/research/construction-pm-parity/` (Procore et al., closed 2026-05), `docs/audits/gvteway-workforce-parity.md`, `docs/research/smartsuite-parity/`.

---

## Top 10 competitors (weighted by overlap with the combined ATLVS surface)

| # | Competitor | Category vs | Why top-10 |
|---|---|---|---|
| 1 | **Momentus Technologies** (Ungerboeck) | ATLVS console | Closest ERP-style venue/event ops platform |
| 2 | **Cvent** | ATLVS console / GVTEWAY | Largest event-tech suite; platform-wide AI layer |
| 3 | **Bizzabo** | GVTEWAY / COMPVSS | Event experience OS; attendee-facing AI |
| 4 | **Current RMS** | ATLVS asset & logistics | Direct rental/asset-ops overlap |
| 5 | **Asana** | ATLVS PM | Fall-2025 release maps 1:1 onto our PM+finance surface |
| 6 | **monday.com** | ATLVS PM/CRM | Three-pillar AI vision; agent program shipping |
| 7 | **ClickUp** | ATLVS PM | Most aggressive agentic-AI shipping cadence |
| 8 | **Connecteam** | COMPVSS | The deskless-workforce reference we already track |
| 9 | **Deputy** | COMPVSS | Agentic workforce orchestration on Bedrock |
| 10 | **Upwork** | GVTEWAY | Uma agentic hiring is the marketplace benchmark |

Second tier, tracked in the findings below: UKG, Homebase, 7shifts (COMPVSS) · Thumbtack, GigSalad, Fiverr (GVTEWAY) · TalentLMS, Docebo, Trainual, Guru, Seismic (LEG3ND).

---

## Verified findings by competitor

### 1. Momentus Technologies — AI platform release (Feb 2, 2026)
- **Ask Mo** — AI assistant answering operational/platform questions and surfacing live performance/event data (rolled out late 2025, announced Feb 2026). [PR Newswire](https://www.prnewswire.com/news-releases/momentus-technologies-announces-ai-powered-platform-enhancements-for-venue-and-event-operations-302676378.html) · [gomomentus.com/ai](https://www.gomomentus.com/ai)
- **Momentus Analytics** — built-in dashboards (sales, revenue, pipeline, space utilization) explicitly positioned as eliminating external BI. Enterprise/Elite tiers.
- **Smart Imports** — automated bulk data entry for event functions with validation + duplicate detection. Enterprise Pro/Premier tiers.

### 2. Cvent — CventIQ (June 10, 2025)
Platform-wide AI layer. Planner side: Instant Session Insights (sentiment/speaker analysis), on-brand content generation (emails, bios, event pages). Hospitality side: AI-generated RFP proposals + response assistants, smart rooming lists, AI event diagrams. Attendee side: one-tap session transcripts/slide captures, AI post-event summaries with next steps ("Session Snapshots", confirmed shipped). [Cvent PR](https://www.cvent.com/en/press-release/cvent-brings-intelligence-and-ai-life-across-its-platform-launch-cventiqtm) · [BusinessWire](https://www.businesswire.com/news/home/20250610206574/en/) · [Skift](https://meetings.skift.com/2025/06/18/cventiq/)

### 3. Bizzabo — attendee AI + registration (2025–2026)
- **Bizzy AI** — attendee copilot in the mobile event app; semantic search over sessions/speakers/directory + organizer-supplied custom knowledge bases for FAQs and venue logistics. Limited rollout Apr 2026, GA Jun 24, 2026, premium add-on; deliberately read-only. [Bizzabo blog](https://www.bizzabo.com/blog/bizzy-ai-attendee-copilot)
- Redesigned registration (widgets, conditional logic, multi-currency, UTM, real-time dashboards; vendor-reported "up to 300%" conversion gains). Organizer-side **Event OS CoPilot**. **Klik** wearables tied to sponsor-ROI data (+38% YoY adoption, vendor-reported). [PR Newswire](https://www.prnewswire.com/news-releases/bizzabo-propels-forward-with-surge-in-intimate-events-product-breakthroughs-and-industry-recognition-302505004.html)

### 4. Current RMS — ops-to-finance loop closures (Aug–Oct 2025)
- Electronic **document approvals** on project documents — customer e-signs/approves via one link (Sept 2025).
- **Damage & loss invoicing** — assets flagged damaged/lost at check-in auto-populate a draft replacement-charge invoice on the opportunity (Aug 2025).
- Labor/resource scheduling: extended scheduler for services, opportunity templates, priority rankings on bookable resources (Oct 2025). [Changelog](https://www.current-rms.com/latest-features) · [help: doc approval](https://help.current-rms.com/en/articles/385122-use-document-approval) · [help: damage/loss](https://help.current-rms.com/en/articles/12043153-damage-and-loss-invoicing)

### 5. Asana — Fall 2025 release (Nov 2025)
- **AI Teammates** (beta; GA expected Q1 FY27) — AI agents assigned tasks like humans, responding in existing collaboration surfaces.
- **AI Risk Reports** — automated weekly project risk assessments flagging risks before they hit timelines (Starter+).
- **Timesheets & Budgets add-on** (GA, $5.99/user/mo) — approvals, billable categorization, per-member billing rates, real-time budget dashboards. [Release page](https://asana.com/inside-asana/fall-release-2025) · [help](https://help.asana.com/s/article/timesheets-and-budgets-add-on)

### 6. monday.com — AI vision + Digital Workforce (Feb 2025 →)
**AI Blocks** (no-code AI actions: categorize/extract), **Product Power-ups** (AI across resource management, predictive risk, CRM data automation), **Digital Workforce** (autonomous agents; "monday Expert" first, Mar 2025; follow-on 2025–2026 releases confirm execution). [IR release](https://ir.monday.com/news-and-events/news-releases/news-details/2025/monday.com-Announces-AI-Vision-to-Empower-Businesses-to-Scale/default.aspx) · [SEC 6-K exhibit](https://www.sec.gov/Archives/edgar/data/0001845338/000117891325000369/exhibit_99-1.htm)

### 7. ClickUp — Super Agents (Dec 22, 2025) + Brain² (May 2026)
Workspace-native ambient AI teammates with full workspace context, running multi-step workflows 24/7 — triggered by @mentions, task assignment, schedules, or events; built via natural-language conversation, no code; permission-gated on higher plans. [Help center](https://help.clickup.com/hc/en-us/articles/31010910371991-What-are-Super-Agents) · [clickup.com/brain/agents](https://clickup.com/brain/agents)

### 8. Connecteam (COMPVSS reference)
- **AI Agent** (Oct 2025) — employees ask in chat, get answers from the company Knowledge Base; admin custom instructions + usage dashboard (Jan 2026). [Releases](https://releases.connecteam.com/) · [help](https://help.connecteam.com/en/articles/11112114-connecteam-s-ai-agent-your-company-s-ai-assistant)
- **AI chat translation** (Jun 2026) — translate an incoming chat message in place. [June 2026 release](https://releases.connecteam.com/148955-june-2026-product-releases)
- **AI Text Enhancement** (Sept 2025) — generate/refine company updates from a prompt.
- **NFC clock-in + auto clock-out on geofence exit** (Feb 2026; Expert plan) — timesheet-flagged, admin approval when devices differ. [help](https://help.connecteam.com/en/articles/10692218-auto-clock-out-employees-when-they-leave-a-worksite)

### 9. Deputy — Deputy AI (Nov 2025, beta)
Conversational manager assistant on Amazon Bedrock: find shift replacements, check who's clocked in, approve timesheets — with human-in-the-loop confirmation. 2026 pipeline: AI Labour Optimisation (demand forecasting → compliant schedules), AI Insights (natural-language queries → charts/summaries), timesheet auto-approval, payroll anomaly detection. [Deputy AI launch](https://news.deputy.com/deputy-ai-is-the-intelligent-trusted-teammate-for-managing-shift-based-businesses) · [AWS release](https://news.deputy.com/deputy-launches-new-ai-platform-on-aws-to-transform-how-businesses-manage-shift-work-ef9g8q)

### 10. Upwork — Uma AI work agent
- **Uma Recruiter** (Oct 2025) — agentic shortlisting, top matches in under 6 hours; extended to the free Basic plan May 5, 2026. Vendor-reported: +30% hires from shortlists, −11% time-to-hire. [Spring 2026 release](https://www.globenewswire.com/news-release/2026/05/05/3287786/0/en/Upwork-Updates-Spring-2026-AI-Powered-Innovations-to-Help-Small-Businesses-Get-Ambitious-Work-Done.html) · [engineering blog](https://www.upwork.com/blog/uma-recruiter-how-we-built-an-agentic-solution-to-talent-matching-and-hiring)
- **Instant Interviews** (Jul 2025) — Uma conducts AI video interviews during the proposal step; recordings + transcripts + structured summaries. [IR release](https://investors.upwork.com/news-releases/news-release-details/upwork-evolves-uma-ai-ai-work-agent-advances-human-ai)
- **Video Meetings** in Messages with AI summaries/transcripts/action items (Jul 2025).

### Second tier (verified)
- **UKG Bryte AI Agents** (Nov 2024→) — Large Action Models; Promotion Agent, Continuous Compliance Agent; guardrailed with human oversight. [UKG newsroom](https://www.ukg.com/company/newsroom/ukg-unveils-bryte-ai-agents-and-capabilities-transform-employee-experiences-ukg-pro-hcm-suite)
- **Homebase AI Assistants** (Jun–Dec 2025) — Hiring Assistant (job posts + AI screener interviews), Scheduling Assistant, Payroll Assistant auto-fixing timecard issues (~2M admin tasks handled since June 2025). [Jun](https://www.businesswire.com/news/home/20250605551546/en/) · [Oct](https://www.businesswire.com/news/home/20251023823122/en/)
- **7shifts** — AI labor demand forecasting tied to compliance (2025); **AI Schedule Importer** — photo of a schedule → extracted shifts (Apr 2026). [What's New Apr 2026](https://kb.7shifts.com/hc/en-us/articles/50424132500499-What-s-New-April-2026)
- **Thumbtack** (Apr 30, 2026) — AI experience replacing category search: describe the problem by text/photo/voice, AI diagnoses + scopes + explains each match. [BusinessWire](https://www.businesswire.com/news/home/20260430186888/en/)
- **GigSalad** — Lead Insights (Mar 2025, paid tier): competitor activity on shared leads (responses/quotes/exclusivity). 2026: native messaging app, Apple Pay/Google Pay/Venmo. [blog](https://www.gigsalad.com/blog/2025-product-updates/)
- **Fiverr** — Dynamic Matching (Dec 2024→2025, AI + human-expert shortlists), **Fiverr Go** (Feb 2025): freelancer-trained personal AI models delivering instant work in the creator's style + personal AI assistant. [Fiverr Go PR](https://www.globenewswire.com/news-release/2025/02/18/3028180/en/)
- **TalentLMS** — TalentCraft AI doc extraction (PDF → interactive units, Mar 2025), AI Skills mapping + Job Pathfinder, **AI Coach** in-course tutor + AI course translations (Jul 30, 2025). [Epignosis PR](https://www.epignosishq.com/talentlms-expands-its-ai-powered-content-creation-and-skill-based-learning-solutions-to-accelerate-employee-training-pathways-and-business-outcomes/) · [AI Coach PR](https://www.prnewswire.com/news-releases/talentlms-elevates-corporate-learning-with-groundbreaking-ai-features-302517251.html)
- **Docebo** — Harmony L&D co-pilot (preview) + **AI Video Presenter** GA (script → lifelike presenter video), Apr 8, 2025. [newsroom](https://www.docebo.com/company/newsroom/docebo-unveils-ai-first-learning-platform-at-docebo-inspire-2025/)
- **Trainual** — AI Assistant (Sep 16, 2025): answers from company content AND people data, with linked source citations. [product update](https://trainual.com/product-updates/meet-your-new-ai-assistant)
- **Guru** — Knowledge Agents cadence through 2025: citations panel, Draft-Card-from-Answer, Slack channel auto-answering, agent web search. [release notes](https://help.getguru.com/docs/guru-release-notes-2025)
- **Seismic** — Aura AI Agents (Fall 2025) + Role-Play Agent AI coach; Aura Copilot generates training lessons. [PR](https://www.seismic.com/newsroom/press-releases/seismic-launches-aura-ai-agents/)
- **When I Work** — nothing notable verified for 2025–2026 (Auto Scheduling is long-standing).

---

## Cross-cutting patterns (what the market converged on this cycle)

1. **Ask-the-platform assistants grounded in org knowledge** — Ask Mo, Connecteam AI Agent, Trainual AI Assistant, Guru Knowledge Agents, Bizzy custom KBs. Answers cite sources; knowledge base is the corpus.
2. **Assignable, ambient AI agents as teammates** — Asana AI Teammates, monday Digital Workforce, ClickUp Super Agents, Deputy AI, UKG Bryte. Trigger-driven (mention/assignment/schedule/event), audit-logged, human-in-the-loop for writes.
3. **Natural-language agent/automation builders** for non-technical operators — ClickUp Super Agent Builder, monday AI Blocks.
4. **End-user-facing AI in the field/attendee shell** — Bizzy AI, CventIQ attendee tools, Connecteam AI Agent: semantic search over event content, schedules, directories, FAQs.
5. **Scheduled AI risk prediction on projects** — Asana AI Risk Reports, monday predictive risk.
6. **Built-in analytics replacing external BI** — Momentus Analytics (validates our v6.3 reports engine; peer benchmarking is the remaining differentiator).
7. **Smart bulk imports** with validation + duplicate detection — Momentus Smart Imports, 7shifts photo schedule importer.
8. **Closing ops-to-finance loops automatically** — Current RMS damage/loss → draft invoice; Asana timesheets → budgets; Cvent RFP → proposal.
9. **AI-assisted document/RFP/proposal generation with e-sign approval links** — CventIQ proposals, Current RMS document approvals.
10. **Agentic marketplace matching** — Upwork Uma Recruiter shortlisting, Fiverr Dynamic Matching, Thumbtack conversational diagnosis; GigSalad lead-competition insights.
11. **AI course authoring from documents** — TalentLMS TalentCraft, SC Training, Docebo AI Video Presenter; plus in-course AI tutoring (TalentLMS AI Coach).
12. **Field-ops time-clock hardening** — Connecteam NFC + geofence auto clock-out; Homebase assisted clock-outs and payroll auto-fix.

Vendor-reported efficacy numbers (Bizzabo 300%, Upwork +30%, etc.) are unaudited marketing figures. Several features are tier-gated or beta — "launched" ≠ universally available. Findings should be refreshed within a quarter; the agent space is moving fast.
