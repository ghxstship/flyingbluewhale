# Site Map & Workflow Inventory

Generated from `src/app/` + `docs/ia/benchmarks/olympics_raci_fbw_gap.xlsx`.

## Summary

- Pages documented: **439**
- Components: **31** · Elements: **20** · Micro-interactions: **13**
- In-scope Olympic workflows cross-referenced: **106**

### By platform
- ATLVS: 280
- GVTEWAY: 75
- COMPVSS: 36
- Marketing: 27
- Auth: 11
- Personal: 9
- Other: 1

### By template
- bespoke: 171
- info: 150
- list: 59
- detail: 36
- hub: 16
- form: 7

## Component library (shared across templates)

| Component | Role | Capabilities | Used in |
|---|---|---|---|
| `ModuleHeader` | Page chrome header | Display eyebrow + title + subtitle · Render action slot (typically Button) | list, detail, hub, info, form, bespoke |
| `DataTable` | Tenant-scoped data grid | Render rows × columns · Row-level hover · Row link via rowHref · Empty state integration | list |
| `DataTableInteractive` | Client-side DataTable wrapper | Column sort · Filter · Saved views · Bulk actions | list |
| `PlatformSidebar` | ATLVS left rail | Render platformNav groups · Active-route highlighting · Collapsible groups | (layout chrome) |
| `PortalRail` | GVTEWAY left rail | Render portalNav(persona) · Active-route highlighting | (layout chrome) |
| `MobileTabBar` | COMPVSS bottom tab bar | Render mobileTabs · Badge counts · Active-tab highlight | (layout chrome) |
| `Button` | Primary interactive element | href navigation · onClick callback · variant=default|ghost|danger · type=submit | all |
| `Input` | Text input | type=text|email|password · validation · placeholder · required | form |
| `Select` | Option selector | Controlled value · Option groups · Disabled state | form |
| `Combobox` | Searchable picker | Typeahead · Async search · Multi-select · Keyboard nav | form, bespoke |
| `DatePicker` | Date input | Calendar popover · Range mode · Min/max constraints | form |
| `RichText` | Markdown-ish editor | Bold/italic/lists · Placeholder · HTML output | form, bespoke |
| `Dialog` | Modal overlay | Open/close · Trap focus · Confirm/cancel | bespoke |
| `Popover` | Anchored tooltip/panel | Anchor positioning · Click/hover triggers · Keyboard dismiss | bespoke |
| `DropdownMenu` | Contextual menu | Trigger + item rendering · Keyboard nav · Submenus | bespoke |
| `Alert` | Inline messaging | severity=info|warn|error|success · Dismissable | form, bespoke |
| `Avatar` | User avatar | image · initials fallback · size variants | bespoke |
| `Badge` | Status pill | variant · icon support | list, detail, bespoke |
| `Breadcrumbs` | Path trail | Linked ancestors · Ellipsis overflow | (layout chrome) |
| `Card` | Surface container | Header/content/footer slots · Hover state · Link wrapper | hub, bespoke |
| `Checkbox` | Binary input | checked/unchecked/indeterminate | form |
| `EmptyState` | Zero-state placeholder | Icon + title + description · Call-to-action | list, detail |
| `MetricCard` | KPI tile | Value + label · Delta indicator · Sparkline | bespoke (dashboards) |
| `ProgressBar` | Progress indicator | Determinate/indeterminate · Color variants | form, bespoke |
| `RadioGroup` | Single-select list | Option set · Keyboard nav | form |
| `RowActions` | Per-row action menu | Overflow menu · Inline actions | list, bespoke |
| `StatusBadge` | Typed status pill | Bound to enum (TicketStatus, POStatus, etc.) | list, detail, bespoke |
| `Tabs` | Tabbed content switch | Keyboard nav · Active state · Controlled / uncontrolled | bespoke |
| `Toast` | Transient notification | success/error/info · auto-dismiss | (global) |
| `Toggle` | Boolean switch | on/off · loading state | form, bespoke |
| `Tooltip` | Hover reveal | Delay open/close · Positioning | (utility) |

## Element library

| Element | HTML | Capabilities |
|---|---|---|
| `text-input` | `input[type=text]` | focus, blur, value-change, validate |
| `email-input` | `input[type=email]` | focus, blur, value-change, validate:email |
| `password-input` | `input[type=password]` | focus, blur, show/hide toggle |
| `number-input` | `input[type=number]` | increment, decrement, min/max clamp |
| `date-input` | `input[type=date]` | calendar open, value-change |
| `textarea` | `textarea` | multiline, resize, value-change |
| `select-native` | `select+option` | value-change |
| `button-primary` | `button` | click, hover, focus, loading-state |
| `button-ghost` | `button` | click, hover, focus |
| `anchor-link` | `a` | click, keyboard-activate, prefetch |
| `image` | `img` | lazy-load, alt text, fallback |
| `icon-svg` | `svg` | decorative / aria-hidden |
| `table-row` | `tr` | hover, row-click |
| `table-cell` | `td` | overflow-truncate, mono vs prose formatting |
| `label` | `label` | click-focuses-input, required-indicator |
| `definition-term` | `dt` | — |
| `definition-data` | `dd` | overflow-truncate |
| `heading-h1` | `h1` | — |
| `heading-h2` | `h2` | — |
| `heading-h3` | `h3` | — |

## Micro-interactions

| Name | Trigger | Effect |
|---|---|---|
| `hover-lift` | mouseenter/leave | translateY(-1px) + shadow |
| `press-scale` | mousedown/up | scale(0.97) |
| `focus-ring` | focus-visible | 2px ring in --accent |
| `skeleton-shimmer` | loading | animated gradient |
| `surface-raised` | none | elevation-2 shadow |
| `fade-in` | mount | opacity 0→1 over 150ms |
| `slide-in-from-right` | drawer open | translateX(100%→0) |
| `checkmark-pop` | action success | scale 0→1.2→1 |
| `toast-slide-up` | toast appear | translateY(20px)+fade |
| `row-expand` | click chevron | height 0→auto |
| `tab-underline-slide` | tab switch | underline translateX |
| `menu-open` | click trigger | fade+scale(0.95→1) |
| `button-loading` | submit | spinner + label fade |

## Pages (full atomic schema)

### ATLVS — 280 pages

#### ATLVS · accommodation — 4 pages

### Accommodation  `/console/accommodation`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/accommodation/page.tsx`](src/app/(platform)/console/accommodation/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### Group blocks  `/console/accommodation/blocks`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/accommodation/blocks/page.tsx`](src/app/(platform)/console/accommodation/blocks/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-080 Olympic Family hotel program (P1); WF-081 Media Village / media housing (P2)
- **Upstream:** accommodation_blocks · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/accommodation/blocks/[blockId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/accommodation/blocks/[blockId]/page.tsx`](src/app/(platform)/console/accommodation/blocks/[blockId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** accommodation_blocks · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Village  `/console/accommodation/village`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/accommodation/village/page.tsx`](src/app/(platform)/console/accommodation/village/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-030 Olympic / Paralympic Village planning (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · accreditation — 10 pages

### Accreditation  `/console/accreditation`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/accreditation/page.tsx`](src/app/(platform)/console/accreditation/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### Categories  `/console/accreditation/categories`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/accreditation/categories/page.tsx`](src/app/(platform)/console/accreditation/categories/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** accreditation_categories · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Accreditation changes  `/console/accreditation/changes`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/accreditation/changes/page.tsx`](src/app/(platform)/console/accreditation/changes/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-054 Accreditation replacement, upgrades, revocations (P1)
- **Upstream:** accreditation_changes · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/accreditation/changes/[changeId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/accreditation/changes/[changeId]/page.tsx`](src/app/(platform)/console/accreditation/changes/[changeId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** accreditation_changes · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Accreditation policy  `/console/accreditation/policy`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/accreditation/policy/page.tsx`](src/app/(platform)/console/accreditation/policy/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-050 Accreditation policy & category matrix (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Print queue  `/console/accreditation/print`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/accreditation/print/page.tsx`](src/app/(platform)/console/accreditation/print/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-052 Accreditation card production & distribution (P1)
- **Upstream:** accreditations · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Gate scans  `/console/accreditation/scans`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/accreditation/scans/page.tsx`](src/app/(platform)/console/accreditation/scans/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-053 Access control & zone management (gates) (P0)
- **Upstream:** access_scans · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Vetting queue  `/console/accreditation/vetting`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/accreditation/vetting/page.tsx`](src/app/(platform)/console/accreditation/vetting/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-051 Background check & vetting (P0)
- **Upstream:** accreditations · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/accreditation/vetting/[applicationId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/accreditation/vetting/[applicationId]/page.tsx`](src/app/(platform)/console/accreditation/vetting/[applicationId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** accreditations · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Accreditation zones  `/console/accreditation/zones`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/accreditation/zones/page.tsx`](src/app/(platform)/console/accreditation/zones/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · ai — 8 pages

### AI hub  `/console/ai`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/ai/page.tsx`](src/app/(platform)/console/ai/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### AI agents  `/console/ai/agents`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/ai/agents/page.tsx`](src/app/(platform)/console/ai/agents/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Assistant  `/console/ai/assistant`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/ai/assistant/page.tsx`](src/app/(platform)/console/ai/assistant/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Conversation  `/console/ai/assistant/[conversationId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/ai/assistant/[conversationId]/page.tsx`](src/app/(platform)/console/ai/assistant/[conversationId]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Automations  `/console/ai/automations`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/ai/automations/page.tsx`](src/app/(platform)/console/ai/automations/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Automation  `/console/ai/automations/[automationId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/ai/automations/[automationId]/page.tsx`](src/app/(platform)/console/ai/automations/[automationId]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### New automation  `/console/ai/automations/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/ai/automations/new/page.tsx`](src/app/(platform)/console/ai/automations/new/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Drafting  `/console/ai/drafting`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/ai/drafting/page.tsx`](src/app/(platform)/console/ai/drafting/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · campaigns — 1 pages

### Campaigns  `/console/campaigns`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/campaigns/page.tsx`](src/app/(platform)/console/campaigns/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · clients — 3 pages

### Clients  `/console/clients`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/clients/page.tsx`](src/app/(platform)/console/clients/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** clients · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### No proposals yet  `/console/clients/[clientId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/clients/[clientId]/page.tsx`](src/app/(platform)/console/clients/[clientId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** proposals · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### New client  `/console/clients/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/clients/new/page.tsx`](src/app/(platform)/console/clients/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · command — 1 pages

### Command palette  `/console/command`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/command/page.tsx`](src/app/(platform)/console/command/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · commercial — 9 pages

### Commercial  `/console/commercial`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/commercial/page.tsx`](src/app/(platform)/console/commercial/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### Brand  `/console/commercial/brand`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/commercial/brand/page.tsx`](src/app/(platform)/console/commercial/brand/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-183 Look of the Games & city dressing (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Hospitality  `/console/commercial/hospitality`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/commercial/hospitality/page.tsx`](src/app/(platform)/console/commercial/hospitality/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-173 Hospitality program (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Record  `/console/commercial/hospitality/[packageId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/commercial/hospitality/[packageId]/page.tsx`](src/app/(platform)/console/commercial/hospitality/[packageId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** rate_card_items · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Licensing  `/console/commercial/licensing`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/commercial/licensing/page.tsx`](src/app/(platform)/console/commercial/licensing/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-172 Licensing & merchandise program (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Sponsor entitlements  `/console/commercial/sponsors`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/commercial/sponsors/page.tsx`](src/app/(platform)/console/commercial/sponsors/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-170 TOP partner servicing (Worldwide Olympic Partners) (P1); WF-171 Domestic sponsor program & activation rights (P1)
- **Upstream:** sponsor_entitlements · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/commercial/sponsors/[sponsorId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/commercial/sponsors/[sponsorId]/page.tsx`](src/app/(platform)/console/commercial/sponsors/[sponsorId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** sponsor_entitlements · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Ticket types  `/console/commercial/tickets`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/commercial/tickets/page.tsx`](src/app/(platform)/console/commercial/tickets/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-174 Ticketing strategy & pricing (P1); WF-175 Ticketing sales channels (public, NOC, sponsor) (P1); WF-176 Ticket access control & secondary market controls (P0)
- **Upstream:** ticket_types · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/commercial/tickets/[ticketTypeId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/commercial/tickets/[ticketTypeId]/page.tsx`](src/app/(platform)/console/commercial/tickets/[ticketTypeId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** ticket_types · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton


#### ATLVS · comms — 4 pages

### Comms  `/console/comms`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/comms/page.tsx`](src/app/(platform)/console/comms/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### External PR  `/console/comms/external`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/comms/external/page.tsx`](src/app/(platform)/console/comms/external/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-251 External PR & spokesperson program (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Internal comms  `/console/comms/internal`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/comms/internal/page.tsx`](src/app/(platform)/console/comms/internal/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-250 Internal communications (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### New campaign  `/console/comms/internal/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** form
- **Source:** [`src/app/(platform)/console/comms/internal/new/page.tsx`](src/app/(platform)/console/comms/internal/new/page.tsx)
- **Capabilities:** render-header, auth-guard, form-submit, validate-required
- **Upstream:** — · **Downstream:** /api/v1/email_templates
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FormShell, Input*, Select*, Button[type=submit]


#### ATLVS · compliance — 1 pages

### Chain of custody  `/console/compliance/coc`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/compliance/coc/page.tsx`](src/app/(platform)/console/compliance/coc/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-101 Sample collection (urine / blood / DBS) (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · console — 1 pages

### Console  `/console`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/page.tsx`](src/app/(platform)/console/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · events — 3 pages

### Events  `/console/events`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/events/page.tsx`](src/app/(platform)/console/events/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** events · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### (r) => r.name  `/console/events/[eventId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/events/[eventId]/page.tsx`](src/app/(platform)/console/events/[eventId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### New event  `/console/events/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/events/new/page.tsx`](src/app/(platform)/console/events/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** projects · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · files — 1 pages

### Files  `/console/files`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/files/page.tsx`](src/app/(platform)/console/files/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · finance — 22 pages

### Finance  `/console/finance`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/page.tsx`](src/app/(platform)/console/finance/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** invoices · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Advances  `/console/finance/advances`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/finance/advances/page.tsx`](src/app/(platform)/console/finance/advances/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** advances · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### (r) => `Advance · ${money(r.amount_cents)  `/console/finance/advances/[advanceId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/advances/[advanceId]/page.tsx`](src/app/(platform)/console/finance/advances/[advanceId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Request advance  `/console/finance/advances/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/advances/new/page.tsx`](src/app/(platform)/console/finance/advances/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Budgets  `/console/finance/budgets`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/finance/budgets/page.tsx`](src/app/(platform)/console/finance/budgets/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-220 Budget planning & control (P1)
- **Upstream:** budgets · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### (r) => `${r.name  `/console/finance/budgets/[budgetId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/budgets/[budgetId]/page.tsx`](src/app/(platform)/console/finance/budgets/[budgetId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### New budget  `/console/finance/budgets/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/budgets/new/page.tsx`](src/app/(platform)/console/finance/budgets/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Expenses  `/console/finance/expenses`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/finance/expenses/page.tsx`](src/app/(platform)/console/finance/expenses/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** expenses · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### (r) => r.description  `/console/finance/expenses/[expenseId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/expenses/[expenseId]/page.tsx`](src/app/(platform)/console/finance/expenses/[expenseId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Log expense  `/console/finance/expenses/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/expenses/new/page.tsx`](src/app/(platform)/console/finance/expenses/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Invoices  `/console/finance/invoices`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/finance/invoices/page.tsx`](src/app/(platform)/console/finance/invoices/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** invoices · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### invoice.title  `/console/finance/invoices/[invoiceId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/finance/invoices/[invoiceId]/page.tsx`](src/app/(platform)/console/finance/invoices/[invoiceId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** invoices · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### New invoice  `/console/finance/invoices/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/invoices/new/page.tsx`](src/app/(platform)/console/finance/invoices/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** clients · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Mileage  `/console/finance/mileage`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/finance/mileage/page.tsx`](src/app/(platform)/console/finance/mileage/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** mileage_logs · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### (r) => `${r.origin  `/console/finance/mileage/[mileageId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/mileage/[mileageId]/page.tsx`](src/app/(platform)/console/finance/mileage/[mileageId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Log mileage  `/console/finance/mileage/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/mileage/new/page.tsx`](src/app/(platform)/console/finance/mileage/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Payouts  `/console/finance/payouts`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/finance/payouts/page.tsx`](src/app/(platform)/console/finance/payouts/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** vendors · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Reports  `/console/finance/reports`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/reports/page.tsx`](src/app/(platform)/console/finance/reports/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** invoices · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Time tracking  `/console/finance/time`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/finance/time/page.tsx`](src/app/(platform)/console/finance/time/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** time_entries · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### (r) => r.description ?? "Time entry"  `/console/finance/time/[entryId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/time/[entryId]/page.tsx`](src/app/(platform)/console/finance/time/[entryId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Log time  `/console/finance/time/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/finance/time/new/page.tsx`](src/app/(platform)/console/finance/time/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Treasury  `/console/finance/treasury`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/finance/treasury/page.tsx`](src/app/(platform)/console/finance/treasury/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-221 Treasury, payments & cash (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · forms — 3 pages

### Forms  `/console/forms`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/forms/page.tsx`](src/app/(platform)/console/forms/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Form  `/console/forms/[formId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/forms/[formId]/page.tsx`](src/app/(platform)/console/forms/[formId]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### New form  `/console/forms/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/forms/new/page.tsx`](src/app/(platform)/console/forms/new/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · inbox — 1 pages

### Inbox  `/console/inbox`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/inbox/page.tsx`](src/app/(platform)/console/inbox/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · integrations — 2 pages

### Integrations  `/console/integrations`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/integrations/page.tsx`](src/app/(platform)/console/integrations/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-131 Games Management Systems (GMS) integration (P1)
- **Upstream:** integration_connectors · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/integrations/[connectorId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/integrations/[connectorId]/page.tsx`](src/app/(platform)/console/integrations/[connectorId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** integration_connectors · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton


#### ATLVS · kb — 2 pages

### Knowledge base  `/console/kb`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/kb/page.tsx`](src/app/(platform)/console/kb/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-261 Knowledge management & Games transfer (OGKM) (P1)
- **Upstream:** kb_articles · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/kb/[articleId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/kb/[articleId]/page.tsx`](src/app/(platform)/console/kb/[articleId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** kb_articles · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton


#### ATLVS · leads — 3 pages

### Leads  `/console/leads`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/leads/page.tsx`](src/app/(platform)/console/leads/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** leads · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### lead.name  `/console/leads/[leadId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/leads/[leadId]/page.tsx`](src/app/(platform)/console/leads/[leadId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** leads · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### New lead  `/console/leads/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/leads/new/page.tsx`](src/app/(platform)/console/leads/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · legal — 9 pages

### Legal  `/console/legal`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/legal/page.tsx`](src/app/(platform)/console/legal/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### Insurance policies  `/console/legal/insurance`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/legal/insurance/page.tsx`](src/app/(platform)/console/legal/insurance/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-240 Insurance program (P2)
- **Upstream:** insurance_policies · **Downstream:** —
- **RBAC visible:** owner, admin, controller
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Trademarks  `/console/legal/ip`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/legal/ip/page.tsx`](src/app/(platform)/console/legal/ip/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-230 Rights & IP management (P1)
- **Upstream:** trademarks · **Downstream:** —
- **RBAC visible:** owner, admin, controller
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/legal/ip/[markId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/legal/ip/[markId]/page.tsx`](src/app/(platform)/console/legal/ip/[markId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** trademarks · **Downstream:** —
- **RBAC visible:** owner, admin, controller
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Privacy  `/console/legal/privacy`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/legal/privacy/page.tsx`](src/app/(platform)/console/legal/privacy/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### Consent records  `/console/legal/privacy/consent`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/legal/privacy/consent/page.tsx`](src/app/(platform)/console/legal/privacy/consent/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** consent_records · **Downstream:** —
- **RBAC visible:** owner, admin, controller
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Data map  `/console/legal/privacy/datamap`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/legal/privacy/datamap/page.tsx`](src/app/(platform)/console/legal/privacy/datamap/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### DSAR requests  `/console/legal/privacy/dsar`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/legal/privacy/dsar/page.tsx`](src/app/(platform)/console/legal/privacy/dsar/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-232 Data protection & privacy compliance (P0)
- **Upstream:** dsar_requests · **Downstream:** —
- **RBAC visible:** owner, admin, controller
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/legal/privacy/dsar/[requestId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/legal/privacy/dsar/[requestId]/page.tsx`](src/app/(platform)/console/legal/privacy/dsar/[requestId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** dsar_requests · **Downstream:** —
- **RBAC visible:** owner, admin, controller
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton


#### ATLVS · locations — 4 pages

### Locations  `/console/locations`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/locations/page.tsx`](src/app/(platform)/console/locations/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** locations · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### (r) => r.name  `/console/locations/[locationId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/locations/[locationId]/page.tsx`](src/app/(platform)/console/locations/[locationId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Add location  `/console/locations/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/locations/new/page.tsx`](src/app/(platform)/console/locations/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Location picker  `/console/locations/picker`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/locations/picker/page.tsx`](src/app/(platform)/console/locations/picker/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · logistics — 8 pages

### Logistics  `/console/logistics`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/logistics/page.tsx`](src/app/(platform)/console/logistics/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### Disposition  `/console/logistics/disposition`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/logistics/disposition/page.tsx`](src/app/(platform)/console/logistics/disposition/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-212 Circularity & materials reuse (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Freight  `/console/logistics/freight`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/logistics/freight/page.tsx`](src/app/(platform)/console/logistics/freight/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-201 Freight, customs & bonded warehouse (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Record  `/console/logistics/freight/[shipmentId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/logistics/freight/[shipmentId]/page.tsx`](src/app/(platform)/console/logistics/freight/[shipmentId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** purchase_orders · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Rate card items  `/console/logistics/ratecard`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/logistics/ratecard/page.tsx`](src/app/(platform)/console/logistics/ratecard/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-200 Sport equipment & rate card logistics (P1)
- **Upstream:** rate_card_items · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/logistics/ratecard/[itemId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/logistics/ratecard/[itemId]/page.tsx`](src/app/(platform)/console/logistics/ratecard/[itemId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** rate_card_items · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Logistics services  `/console/logistics/services`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/logistics/services/page.tsx`](src/app/(platform)/console/logistics/services/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-203 Waste & cleaning operations (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Warehouse  `/console/logistics/warehouse`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/logistics/warehouse/page.tsx`](src/app/(platform)/console/logistics/warehouse/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-202 Venue materials, FF&E, warehousing (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · meetings — 2 pages

### Meetings  `/console/meetings`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/meetings/page.tsx`](src/app/(platform)/console/meetings/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-042 IF technical meetings & team leaders' meetings (P2); WF-043 Chef de Mission seminar & CdM-OCOG interface (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Record  `/console/meetings/[meetingId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/meetings/[meetingId]/page.tsx`](src/app/(platform)/console/meetings/[meetingId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** events · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton


#### ATLVS · operations — 2 pages

### Incidents  `/console/operations/incidents`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/operations/incidents/page.tsx`](src/app/(platform)/console/operations/incidents/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Log incident  `/console/operations/incidents/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/operations/incidents/new/page.tsx`](src/app/(platform)/console/operations/incidents/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · ops — 4 pages

### Operations  `/console/ops`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/ops/page.tsx`](src/app/(platform)/console/ops/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### TOC  `/console/ops/toc`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/ops/toc/page.tsx`](src/app/(platform)/console/ops/toc/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Workflows:** WF-134 Technology operations centre (TOC) (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### Changes  `/console/ops/toc/changes`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/ops/toc/changes/page.tsx`](src/app/(platform)/console/ops/toc/changes/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Problems  `/console/ops/toc/problems`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/ops/toc/problems/page.tsx`](src/app/(platform)/console/ops/toc/problems/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · participants — 6 pages

### Participants  `/console/participants`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/participants/page.tsx`](src/app/(platform)/console/participants/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### Delegations  `/console/participants/delegations`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/participants/delegations/page.tsx`](src/app/(platform)/console/participants/delegations/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-040 NOC services & attaché program (P1)
- **Upstream:** delegations · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/participants/delegations/[delegationId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/participants/delegations/[delegationId]/page.tsx`](src/app/(platform)/console/participants/delegations/[delegationId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** delegations · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Entries  `/console/participants/entries`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/participants/entries/page.tsx`](src/app/(platform)/console/participants/entries/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-021 Qualification system & entries (P2)
- **Upstream:** delegation_entries · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Visa cases  `/console/participants/visa`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/participants/visa/page.tsx`](src/app/(platform)/console/participants/visa/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-256 Border / visa / immigration facilitation (P1)
- **Upstream:** visa_cases · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/participants/visa/[caseId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/participants/visa/[caseId]/page.tsx`](src/app/(platform)/console/participants/visa/[caseId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** visa_cases · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton


#### ATLVS · people — 9 pages

### Directory  `/console/people`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/people/page.tsx`](src/app/(platform)/console/people/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Workflows:** WF-023 Technical officials appointment & training (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### (r) => r.users?.name ?? r.users?.email ?? "Member"  `/console/people/[personId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/people/[personId]/page.tsx`](src/app/(platform)/console/people/[personId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Credentials  `/console/people/credentials`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/people/credentials/page.tsx`](src/app/(platform)/console/people/credentials/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Credential asset linker  `/console/people/credentials/asset-linker`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/people/credentials/asset-linker/page.tsx`](src/app/(platform)/console/people/credentials/asset-linker/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Crew  `/console/people/crew`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/people/crew/page.tsx`](src/app/(platform)/console/people/crew/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** crew_members · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### (r) => r.name  `/console/people/crew/[crewId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/people/crew/[crewId]/page.tsx`](src/app/(platform)/console/people/crew/[crewId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Add crew member  `/console/people/crew/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/people/crew/new/page.tsx`](src/app/(platform)/console/people/crew/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Invites  `/console/people/invites`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/people/invites/page.tsx`](src/app/(platform)/console/people/invites/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Role matrix  `/console/people/roles`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/people/roles/page.tsx`](src/app/(platform)/console/people/roles/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · pipeline — 2 pages

### Pipeline  `/console/pipeline`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/pipeline/page.tsx`](src/app/(platform)/console/pipeline/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** leads · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### (r) => r.name  `/console/pipeline/[dealId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/pipeline/[dealId]/page.tsx`](src/app/(platform)/console/pipeline/[dealId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · procurement — 16 pages

### Procurement  `/console/procurement`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/procurement/page.tsx`](src/app/(platform)/console/procurement/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** vendors · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Approved item catalog  `/console/procurement/catalog`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/procurement/catalog/page.tsx`](src/app/(platform)/console/procurement/catalog/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Purchase orders  `/console/procurement/purchase-orders`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/procurement/purchase-orders/page.tsx`](src/app/(platform)/console/procurement/purchase-orders/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** purchase_orders · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### po.title  `/console/procurement/purchase-orders/[poId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/procurement/purchase-orders/[poId]/page.tsx`](src/app/(platform)/console/procurement/purchase-orders/[poId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** purchase_orders · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### New purchase order  `/console/procurement/purchase-orders/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/procurement/purchase-orders/new/page.tsx`](src/app/(platform)/console/procurement/purchase-orders/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** vendors · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Requisitions  `/console/procurement/requisitions`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/procurement/requisitions/page.tsx`](src/app/(platform)/console/procurement/requisitions/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** requisitions · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### (r) => r.description ?? "Requisition"  `/console/procurement/requisitions/[reqId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/procurement/requisitions/[reqId]/page.tsx`](src/app/(platform)/console/procurement/requisitions/[reqId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### New requisition  `/console/procurement/requisitions/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/procurement/requisitions/new/page.tsx`](src/app/(platform)/console/procurement/requisitions/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### RFQs  `/console/procurement/rfqs`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/procurement/rfqs/page.tsx`](src/app/(platform)/console/procurement/rfqs/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### RFQ  `/console/procurement/rfqs/[rfqId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/procurement/rfqs/[rfqId]/page.tsx`](src/app/(platform)/console/procurement/rfqs/[rfqId]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### New RFQ  `/console/procurement/rfqs/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/procurement/rfqs/new/page.tsx`](src/app/(platform)/console/procurement/rfqs/new/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Supplier scorecards  `/console/procurement/scorecards`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/procurement/scorecards/page.tsx`](src/app/(platform)/console/procurement/scorecards/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-223 Supplier performance & SLA management (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Sourcing  `/console/procurement/sourcing`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/procurement/sourcing/page.tsx`](src/app/(platform)/console/procurement/sourcing/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-222 Procurement strategy & contracts (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Vendors  `/console/procurement/vendors`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/procurement/vendors/page.tsx`](src/app/(platform)/console/procurement/vendors/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** vendors · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### (r) => r.name  `/console/procurement/vendors/[vendorId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/procurement/vendors/[vendorId]/page.tsx`](src/app/(platform)/console/procurement/vendors/[vendorId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### New vendor  `/console/procurement/vendors/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/procurement/vendors/new/page.tsx`](src/app/(platform)/console/procurement/vendors/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · production — 20 pages

### AV systems  `/console/production/av`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/production/av/page.tsx`](src/app/(platform)/console/production/av/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-135 Broadcast & venue AV systems (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Compounds  `/console/production/compounds`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/production/compounds/page.tsx`](src/app/(platform)/console/production/compounds/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-113 Venue broadcast compounds & positions (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Dispatch  `/console/production/dispatch`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/production/dispatch/page.tsx`](src/app/(platform)/console/production/dispatch/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Dispatch  `/console/production/dispatch/[dispatchId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/production/dispatch/[dispatchId]/page.tsx`](src/app/(platform)/console/production/dispatch/[dispatchId]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Live dispatch  `/console/production/dispatch/live`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/production/dispatch/live/page.tsx`](src/app/(platform)/console/production/dispatch/live/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Equipment  `/console/production/equipment`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/production/equipment/page.tsx`](src/app/(platform)/console/production/equipment/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** equipment · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### (r) => r.name  `/console/production/equipment/[equipmentId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/production/equipment/[equipmentId]/page.tsx`](src/app/(platform)/console/production/equipment/[equipmentId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Add equipment  `/console/production/equipment/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/production/equipment/new/page.tsx`](src/app/(platform)/console/production/equipment/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Fabrication  `/console/production/fabrication`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/production/fabrication/page.tsx`](src/app/(platform)/console/production/fabrication/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** fabrication_orders · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### (r) => r.title  `/console/production/fabrication/[orderId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/production/fabrication/[orderId]/page.tsx`](src/app/(platform)/console/production/fabrication/[orderId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### New fabrication order  `/console/production/fabrication/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/production/fabrication/new/page.tsx`](src/app/(platform)/console/production/fabrication/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Logistics  `/console/production/logistics`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/production/logistics/page.tsx`](src/app/(platform)/console/production/logistics/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Rentals  `/console/production/rentals`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/production/rentals/page.tsx`](src/app/(platform)/console/production/rentals/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** rentals · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### () => "Rental"  `/console/production/rentals/[rentalId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/production/rentals/[rentalId]/page.tsx`](src/app/(platform)/console/production/rentals/[rentalId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Rental availability  `/console/production/rentals/availability`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/production/rentals/availability/page.tsx`](src/app/(platform)/console/production/rentals/availability/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### New rental  `/console/production/rentals/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/production/rentals/new/page.tsx`](src/app/(platform)/console/production/rentals/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** equipment · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Run of show  `/console/production/ros`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/production/ros/page.tsx`](src/app/(platform)/console/production/ros/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-025 Sport presentation & in-venue show (P1); WF-114 Mixed zone & post-event broadcast operations (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Warehouse  `/console/production/warehouse`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/production/warehouse/page.tsx`](src/app/(platform)/console/production/warehouse/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Inventory  `/console/production/warehouse/inventory`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/production/warehouse/inventory/page.tsx`](src/app/(platform)/console/production/warehouse/inventory/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Warehouse locations  `/console/production/warehouse/locations`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/production/warehouse/locations/page.tsx`](src/app/(platform)/console/production/warehouse/locations/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · programs — 16 pages

### Programs  `/console/programs`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/programs/page.tsx`](src/app/(platform)/console/programs/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### Cases  `/console/programs/cases`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/programs/cases/page.tsx`](src/app/(platform)/console/programs/cases/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-028 Protests, appeals & juries (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Ceremonies  `/console/programs/ceremonies`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/programs/ceremonies/page.tsx`](src/app/(platform)/console/programs/ceremonies/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-029 Victory / medal ceremonies (event) (P1); WF-034 Team welcome ceremonies & flag raising (P2); WF-150 Opening ceremony (P1); WF-151 Closing ceremony & flag handover (P1); WF-154 Medal design, production, and ceremony logistics (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Record  `/console/programs/ceremonies/[ceremonyId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/programs/ceremonies/[ceremonyId]/page.tsx`](src/app/(platform)/console/programs/ceremonies/[ceremonyId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** events · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Press conferences  `/console/programs/pressconf`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/programs/pressconf/page.tsx`](src/app/(platform)/console/programs/pressconf/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-121 Venue press operations & press conferences (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Protocol  `/console/programs/protocol`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/programs/protocol/page.tsx`](src/app/(platform)/console/programs/protocol/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-152 Olympic protocol & dignitary management (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Readiness exercises  `/console/programs/readiness`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/programs/readiness/page.tsx`](src/app/(platform)/console/programs/readiness/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-024 Test events & operational readiness (P1); WF-260 Operational readiness exercises (TTX / FSE) (P1)
- **Upstream:** readiness_exercises · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/programs/readiness/[exerciseId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/programs/readiness/[exerciseId]/page.tsx`](src/app/(platform)/console/programs/readiness/[exerciseId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** readiness_exercises · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Program reviews  `/console/programs/reviews`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/programs/reviews/page.tsx`](src/app/(platform)/console/programs/reviews/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-004 Coordination Commission cycle (P2)
- **Upstream:** program_reviews · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/programs/reviews/[reviewId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/programs/reviews/[reviewId]/page.tsx`](src/app/(platform)/console/programs/reviews/[reviewId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** program_reviews · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Risk register  `/console/programs/risk`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/programs/risk/page.tsx`](src/app/(platform)/console/programs/risk/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-006 Games-wide risk register & treatment (P0)
- **Upstream:** risks · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/programs/risk/[riskId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/programs/risk/[riskId]/page.tsx`](src/app/(platform)/console/programs/risk/[riskId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** risks · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### New risk  `/console/programs/risk/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** form
- **Source:** [`src/app/(platform)/console/programs/risk/new/page.tsx`](src/app/(platform)/console/programs/risk/new/page.tsx)
- **Capabilities:** render-header, auth-guard, form-submit, validate-required
- **Upstream:** — · **Downstream:** /api/v1/risks
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FormShell, Input*, Select*, Button[type=submit]

### Master schedule  `/console/programs/schedule`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/programs/schedule/page.tsx`](src/app/(platform)/console/programs/schedule/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-005 Strategic master schedule / master program (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Program scope  `/console/programs/scope`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/programs/scope/page.tsx`](src/app/(platform)/console/programs/scope/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-020 Sport program & event quotas (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Sessions  `/console/programs/sessions`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/programs/sessions/page.tsx`](src/app/(platform)/console/programs/sessions/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-022 Competition schedule (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · projects — 18 pages

### Projects  `/console/projects`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/page.tsx`](src/app/(platform)/console/projects/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### project.name  `/console/projects/[projectId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/page.tsx`](src/app/(platform)/console/projects/[projectId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Advancing  `/console/projects/[projectId]/advancing`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/advancing/page.tsx`](src/app/(platform)/console/projects/[projectId]/advancing/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Branding  `/console/projects/[projectId]/branding`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/branding/page.tsx`](src/app/(platform)/console/projects/[projectId]/branding/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Budget  `/console/projects/[projectId]/budget`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/budget/page.tsx`](src/app/(platform)/console/projects/[projectId]/budget/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Calendar  `/console/projects/[projectId]/calendar`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/calendar/page.tsx`](src/app/(platform)/console/projects/[projectId]/calendar/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Crew  `/console/projects/[projectId]/crew`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/crew/page.tsx`](src/app/(platform)/console/projects/[projectId]/crew/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Files  `/console/projects/[projectId]/files`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/files/page.tsx`](src/app/(platform)/console/projects/[projectId]/files/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Gantt  `/console/projects/[projectId]/gantt`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/gantt/page.tsx`](src/app/(platform)/console/projects/[projectId]/gantt/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Event guides  `/console/projects/[projectId]/guides`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/guides/page.tsx`](src/app/(platform)/console/projects/[projectId]/guides/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### `${persona.charAt(0).toUpperCase() + persona.slice(1)  `/console/projects/[projectId]/guides/[persona]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/guides/[persona]/page.tsx`](src/app/(platform)/console/projects/[projectId]/guides/[persona]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Overview  `/console/projects/[projectId]/overview`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/overview/page.tsx`](src/app/(platform)/console/projects/[projectId]/overview/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Portal preview  `/console/projects/[projectId]/portal-preview`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/portal-preview/page.tsx`](src/app/(platform)/console/projects/[projectId]/portal-preview/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Roadmap  `/console/projects/[projectId]/roadmap`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/roadmap/page.tsx`](src/app/(platform)/console/projects/[projectId]/roadmap/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Stage plots  `/console/projects/[projectId]/stage-plots`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/stage-plots/page.tsx`](src/app/(platform)/console/projects/[projectId]/stage-plots/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Drag-and-drop 2D stage layout editor.  `/console/projects/[projectId]/stage-plots/[stagePlotId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/stage-plots/[stagePlotId]/page.tsx`](src/app/(platform)/console/projects/[projectId]/stage-plots/[stagePlotId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Tasks  `/console/projects/[projectId]/tasks`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/[projectId]/tasks/page.tsx`](src/app/(platform)/console/projects/[projectId]/tasks/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### New project  `/console/projects/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/projects/new/page.tsx`](src/app/(platform)/console/projects/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · proposals — 5 pages

### Proposals  `/console/proposals`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/proposals/page.tsx`](src/app/(platform)/console/proposals/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** proposals · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### proposal.title  `/console/proposals/[proposalId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/proposals/[proposalId]/page.tsx`](src/app/(platform)/console/proposals/[proposalId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** proposals · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### `Edit · ${proposal.title  `/console/proposals/[proposalId]/edit`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/proposals/[proposalId]/edit/page.tsx`](src/app/(platform)/console/proposals/[proposalId]/edit/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### New proposal  `/console/proposals/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/proposals/new/page.tsx`](src/app/(platform)/console/proposals/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** clients · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Proposal templates  `/console/proposals/templates`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/proposals/templates/page.tsx`](src/app/(platform)/console/proposals/templates/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · ratecard — 1 pages

### Rate card  `/console/ratecard`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/ratecard/page.tsx`](src/app/(platform)/console/ratecard/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-041 Team delegation registration & rate card (P1)
- **Upstream:** rate_card_items · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState


#### ATLVS · safety — 17 pages

### Safety & Incidents  `/console/safety`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/safety/page.tsx`](src/app/(platform)/console/safety/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### BC/DR  `/console/safety/bcdr`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/safety/bcdr/page.tsx`](src/app/(platform)/console/safety/bcdr/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-241 Business continuity & disaster recovery (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Crisis alerts  `/console/safety/crisis`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/safety/crisis/page.tsx`](src/app/(platform)/console/safety/crisis/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-252 Crisis communications (P0)
- **Upstream:** crisis_alerts · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### New alert  `/console/safety/crisis/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** form
- **Source:** [`src/app/(platform)/console/safety/crisis/new/page.tsx`](src/app/(platform)/console/safety/crisis/new/page.tsx)
- **Capabilities:** render-header, auth-guard, form-submit, validate-required
- **Upstream:** — · **Downstream:** /api/v1/crisis_alerts
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FormShell, Input*, Select*, Button[type=submit]

### Cyber incident response  `/console/safety/cyber-ir`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/safety/cyber-ir/page.tsx`](src/app/(platform)/console/safety/cyber-ir/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-142 Cyber incident response & recovery (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Environmental events  `/console/safety/environmental`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/safety/environmental/page.tsx`](src/app/(platform)/console/safety/environmental/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-094 Heat / environmental response (P1)
- **Upstream:** environmental_events · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Guard tours  `/console/safety/guard-tours`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/safety/guard-tours/page.tsx`](src/app/(platform)/console/safety/guard-tours/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-062 Venue security (screening, guarding, patrol) (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Safety incidents  `/console/safety/incidents`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/safety/incidents/page.tsx`](src/app/(platform)/console/safety/incidents/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-064 Cyber & physical security convergence (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Major incidents  `/console/safety/major-incident`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/safety/major-incident/page.tsx`](src/app/(platform)/console/safety/major-incident/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-065 Crisis / major incident response (P0)
- **Upstream:** major_incidents · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/safety/major-incident/[eventId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/safety/major-incident/[eventId]/page.tsx`](src/app/(platform)/console/safety/major-incident/[eventId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** major_incidents · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Medical  `/console/safety/medical`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/safety/medical/page.tsx`](src/app/(platform)/console/safety/medical/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-092 Venue medical services (FOP to spectator) (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Medical encounters  `/console/safety/medical/encounters`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/safety/medical/encounters/page.tsx`](src/app/(platform)/console/safety/medical/encounters/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** medical_encounters · **Downstream:** —
- **RBAC visible:** owner, admin, controller
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Medical plan  `/console/safety/medical/plan`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/safety/medical/plan/page.tsx`](src/app/(platform)/console/safety/medical/plan/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-090 Games medical services plan (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Playbooks  `/console/safety/playbooks`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/safety/playbooks/page.tsx`](src/app/(platform)/console/safety/playbooks/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-061 Security concept of operations (ConOps) (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Safeguarding reports  `/console/safety/safeguarding`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/safety/safeguarding/page.tsx`](src/app/(platform)/console/safety/safeguarding/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-035 Athlete wellbeing & safeguarding (P1)
- **Upstream:** safeguarding_reports · **Downstream:** —
- **RBAC visible:** owner, admin, +reporter
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/safety/safeguarding/[reportId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/safety/safeguarding/[reportId]/page.tsx`](src/app/(platform)/console/safety/safeguarding/[reportId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** safeguarding_reports · **Downstream:** —
- **RBAC visible:** owner, admin, +reporter
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Threat register  `/console/safety/threats`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/safety/threats/page.tsx`](src/app/(platform)/console/safety/threats/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-060 Threat assessment & intelligence fusion (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · schedule — 1 pages

### Schedule  `/console/schedule`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/schedule/page.tsx`](src/app/(platform)/console/schedule/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** events · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState


#### ATLVS · services — 3 pages

### Service desk  `/console/services`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/services/page.tsx`](src/app/(platform)/console/services/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### Service requests  `/console/services/requests`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/services/requests/page.tsx`](src/app/(platform)/console/services/requests/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-032 Village resident services (dining, laundry, leisure) (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Record  `/console/services/requests/[requestId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/services/requests/[requestId]/page.tsx`](src/app/(platform)/console/services/requests/[requestId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** tasks · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton


#### ATLVS · settings — 18 pages

### Workspace settings  `/console/settings`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/page.tsx`](src/app/(platform)/console/settings/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### API  `/console/settings/api`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/api/page.tsx`](src/app/(platform)/console/settings/api/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Audit log  `/console/settings/audit`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/settings/audit/page.tsx`](src/app/(platform)/console/settings/audit/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** audit_log · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Billing  `/console/settings/billing`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/billing/page.tsx`](src/app/(platform)/console/settings/billing/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Branding  `/console/settings/branding`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/branding/page.tsx`](src/app/(platform)/console/settings/branding/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Compliance  `/console/settings/compliance`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/compliance/page.tsx`](src/app/(platform)/console/settings/compliance/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Custom domains  `/console/settings/domains`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/domains/page.tsx`](src/app/(platform)/console/settings/domains/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Email templates  `/console/settings/email-templates`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/email-templates/page.tsx`](src/app/(platform)/console/settings/email-templates/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Export Centre  `/console/settings/exports`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/exports/page.tsx`](src/app/(platform)/console/settings/exports/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Governance  `/console/settings/governance`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/settings/governance/page.tsx`](src/app/(platform)/console/settings/governance/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-002 OCOG incorporation & governance setup (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Import Centre  `/console/settings/imports`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/imports/page.tsx`](src/app/(platform)/console/settings/imports/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Integrations  `/console/settings/integrations`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/integrations/page.tsx`](src/app/(platform)/console/settings/integrations/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Integration  `/console/settings/integrations/[integrationId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/settings/integrations/[integrationId]/page.tsx`](src/app/(platform)/console/settings/integrations/[integrationId]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Integrations marketplace  `/console/settings/integrations/marketplace`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/settings/integrations/marketplace/page.tsx`](src/app/(platform)/console/settings/integrations/marketplace/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Organization  `/console/settings/organization`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/organization/page.tsx`](src/app/(platform)/console/settings/organization/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Webhooks  `/console/settings/webhooks`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/webhooks/page.tsx`](src/app/(platform)/console/settings/webhooks/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### endpoint.url  `/console/settings/webhooks/[webhookId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/webhooks/[webhookId]/page.tsx`](src/app/(platform)/console/settings/webhooks/[webhookId]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### New webhook endpoint  `/console/settings/webhooks/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/settings/webhooks/new/page.tsx`](src/app/(platform)/console/settings/webhooks/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · sustainability — 2 pages

### Sustainability  `/console/sustainability`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/sustainability/page.tsx`](src/app/(platform)/console/sustainability/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Workflows:** WF-210 Sustainability strategy & reporting (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### Carbon  `/console/sustainability/carbon`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/sustainability/carbon/page.tsx`](src/app/(platform)/console/sustainability/carbon/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-211 Carbon accounting & offsets (P2)
- **Upstream:** sustainability_metrics · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState


#### ATLVS · tasks — 3 pages

### Tasks  `/console/tasks`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/tasks/page.tsx`](src/app/(platform)/console/tasks/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Upstream:** tasks · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### task.title  `/console/tasks/[taskId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/tasks/[taskId]/page.tsx`](src/app/(platform)/console/tasks/[taskId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** tasks · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### New task  `/console/tasks/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** bespoke
- **Source:** [`src/app/(platform)/console/tasks/new/page.tsx`](src/app/(platform)/console/tasks/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** projects · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### ATLVS · transport — 7 pages

### Transport  `/console/transport`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/transport/page.tsx`](src/app/(platform)/console/transport/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### A&D manifests  `/console/transport/ad`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/transport/ad/page.tsx`](src/app/(platform)/console/transport/ad/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-031 Athlete arrival & departure (A&D) (P0); WF-076 Airport arrivals / departures operations (P1)
- **Upstream:** ad_manifests · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/transport/ad/[manifestId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/transport/ad/[manifestId]/page.tsx`](src/app/(platform)/console/transport/ad/[manifestId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** ad_manifests · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Dispatch  `/console/transport/dispatch`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/transport/dispatch/page.tsx`](src/app/(platform)/console/transport/dispatch/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-071 Athlete & team transport (T1/T2) (P0); WF-072 Olympic Family transport (T3) fleet (P1); WF-073 Media transport (P2)
- **Upstream:** dispatch_runs · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/transport/dispatch/[runId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/transport/dispatch/[runId]/page.tsx`](src/app/(platform)/console/transport/dispatch/[runId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** dispatch_runs · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Fleets  `/console/transport/fleets`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/transport/fleets/page.tsx`](src/app/(platform)/console/transport/fleets/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Workforce shuttles  `/console/transport/workforce`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/transport/workforce/page.tsx`](src/app/(platform)/console/transport/workforce/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-074 Workforce transport (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### ATLVS · venues — 12 pages

### Venues  `/console/venues`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/venues/page.tsx`](src/app/(platform)/console/venues/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-010 Venue master plan (P0); WF-180 Live Sites / fan zones (P2)
- **Upstream:** venues · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/venues/[venueId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/venues/[venueId]/page.tsx`](src/app/(platform)/console/venues/[venueId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** venues · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Build  `/console/venues/[venueId]/build`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/venues/[venueId]/build/page.tsx`](src/app/(platform)/console/venues/[venueId]/build/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-012 Venue construction / fit-out oversight (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Certifications  `/console/venues/[venueId]/certifications`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/venues/[venueId]/certifications/page.tsx`](src/app/(platform)/console/venues/[venueId]/certifications/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-014 Field of Play (FOP) homologation (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Closeout  `/console/venues/[venueId]/closeout`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/venues/[venueId]/closeout/page.tsx`](src/app/(platform)/console/venues/[venueId]/closeout/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-018 Venue demobilization & reinstatement (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Design  `/console/venues/[venueId]/design`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/venues/[venueId]/design/page.tsx`](src/app/(platform)/console/venues/[venueId]/design/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-011 Venue design & overlay specification (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Handover  `/console/venues/[venueId]/handover`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/venues/[venueId]/handover/page.tsx`](src/app/(platform)/console/venues/[venueId]/handover/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-013 Venue commissioning & handover (OCOG takeover) (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Run of show  `/console/venues/[venueId]/ros`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/venues/[venueId]/ros/page.tsx`](src/app/(platform)/console/venues/[venueId]/ros/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-017 Venue daily run of show / EOD / BOD (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Venue Operations Plan  `/console/venues/[venueId]/vop`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/venues/[venueId]/vop/page.tsx`](src/app/(platform)/console/venues/[venueId]/vop/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-015 Venue Operations Plan (VOP) (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Zones  `/console/venues/[venueId]/zones`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/venues/[venueId]/zones/page.tsx`](src/app/(platform)/console/venues/[venueId]/zones/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### New venue  `/console/venues/new`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** form
- **Source:** [`src/app/(platform)/console/venues/new/page.tsx`](src/app/(platform)/console/venues/new/page.tsx)
- **Capabilities:** render-header, auth-guard, form-submit, validate-required
- **Upstream:** — · **Downstream:** /api/v1/venues
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FormShell, Input*, Select*, Button[type=submit]

### Training venues  `/console/venues/training`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/venues/training/page.tsx`](src/app/(platform)/console/venues/training/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-033 Training venue access & bookings (P1)
- **Upstream:** venues · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState


#### ATLVS · workforce — 16 pages

### Workforce  `/console/workforce`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** hub
- **Source:** [`src/app/(platform)/console/workforce/page.tsx`](src/app/(platform)/console/workforce/page.tsx)
- **Capabilities:** render-header, auth-guard, link-grid
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → LinkGrid, CardLink*

### Contractors  `/console/workforce/contractors`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/workforce/contractors/page.tsx`](src/app/(platform)/console/workforce/contractors/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-193 Contractor management (P1)
- **Upstream:** workforce_members · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/workforce/contractors/[contractorId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/workforce/contractors/[contractorId]/page.tsx`](src/app/(platform)/console/workforce/contractors/[contractorId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** workforce_members · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Deployment  `/console/workforce/deployment`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/workforce/deployment/page.tsx`](src/app/(platform)/console/workforce/deployment/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-016 Venue workforce deployment (P0)
- **Upstream:** workforce_deployments · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Workforce housing  `/console/workforce/housing`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/workforce/housing/page.tsx`](src/app/(platform)/console/workforce/housing/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-082 Workforce housing & billeting (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Workforce planning  `/console/workforce/planning`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/workforce/planning/page.tsx`](src/app/(platform)/console/workforce/planning/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-190 Workforce strategy & FTE planning (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Rosters  `/console/workforce/rosters`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/workforce/rosters/page.tsx`](src/app/(platform)/console/workforce/rosters/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-197 Scheduling, shifts & time attendance (P0)
- **Upstream:** rosters · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/workforce/rosters/[rosterId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/workforce/rosters/[rosterId]/page.tsx`](src/app/(platform)/console/workforce/rosters/[rosterId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** rosters · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Workforce services  `/console/workforce/services`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/workforce/services/page.tsx`](src/app/(platform)/console/workforce/services/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-195 Workforce services (meals, breaks, check-in/out) (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Paid staff  `/console/workforce/staff`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/workforce/staff/page.tsx`](src/app/(platform)/console/workforce/staff/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-191 Paid staff recruitment & onboarding (P1)
- **Upstream:** workforce_members · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/workforce/staff/[staffId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/workforce/staff/[staffId]/page.tsx`](src/app/(platform)/console/workforce/staff/[staffId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** workforce_members · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Training catalog  `/console/workforce/training`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/workforce/training/page.tsx`](src/app/(platform)/console/workforce/training/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-196 Training & certification (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Record  `/console/workforce/training/[courseId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/workforce/training/[courseId]/page.tsx`](src/app/(platform)/console/workforce/training/[courseId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** kb_articles · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton

### Uniforms  `/console/workforce/uniforms`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** info
- **Source:** [`src/app/(platform)/console/workforce/uniforms/page.tsx`](src/app/(platform)/console/workforce/uniforms/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-194 Uniform distribution & rate card (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Volunteers  `/console/workforce/volunteers`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** list
- **Source:** [`src/app/(platform)/console/workforce/volunteers/page.tsx`](src/app/(platform)/console/workforce/volunteers/page.tsx)
- **Capabilities:** render-header, auth-guard, list-records, row-click-detail, empty-state, force-dynamic
- **Workflows:** WF-192 Volunteer program (recruitment → deployment) (P0)
- **Upstream:** workforce_members · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → DataTable, EmptyState

### Record  `/console/workforce/volunteers/[volunteerId]`
- **Atomic:** Page · **Platform:** ATLVS · **Template:** detail
- **Source:** [`src/app/(platform)/console/workforce/volunteers/[volunteerId]/page.tsx`](src/app/(platform)/console/workforce/volunteers/[volunteerId]/page.tsx)
- **Capabilities:** render-header, auth-guard, get-record, not-found, back-nav, field-dump
- **Upstream:** workforce_members · **Downstream:** —
- **RBAC visible:** owner, admin, controller, collaborator
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FieldDumpDL, BackButton


### GVTEWAY — 75 pages

#### GVTEWAY · apply — 2 pages

### Apply  `/p/[slug]/apply`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/apply/page.tsx`](src/app/(portal)/p/[slug]/apply/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-051 Background check & vetting (P0); WF-191 Paid staff recruitment & onboarding (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Changes  `/p/[slug]/apply/changes`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/apply/changes/page.tsx`](src/app/(portal)/p/[slug]/apply/changes/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-054 Accreditation replacement, upgrades, revocations (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### GVTEWAY · artist — 6 pages

### Artist  `/p/[slug]/artist`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/artist/page.tsx`](src/app/(portal)/p/[slug]/artist/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Artist  `/p/[slug]/artist/advancing`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/artist/advancing/page.tsx`](src/app/(portal)/p/[slug]/artist/advancing/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Catering  `/p/[slug]/artist/catering`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/artist/catering/page.tsx`](src/app/(portal)/p/[slug]/artist/catering/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Show schedule  `/p/[slug]/artist/schedule`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/artist/schedule/page.tsx`](src/app/(portal)/p/[slug]/artist/schedule/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Travel  `/p/[slug]/artist/travel`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/artist/travel/page.tsx`](src/app/(portal)/p/[slug]/artist/travel/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Venue  `/p/[slug]/artist/venue`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/artist/venue/page.tsx`](src/app/(portal)/p/[slug]/artist/venue/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### GVTEWAY · athlete — 6 pages

### Athlete portal  `/p/[slug]/athlete`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/athlete/page.tsx`](src/app/(portal)/p/[slug]/athlete/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Privacy  `/p/[slug]/athlete/privacy`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/athlete/privacy/page.tsx`](src/app/(portal)/p/[slug]/athlete/privacy/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Requests  `/p/[slug]/athlete/requests`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/athlete/requests/page.tsx`](src/app/(portal)/p/[slug]/athlete/requests/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-032 Village resident services (dining, laundry, leisure) (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Safeguarding  `/p/[slug]/athlete/safeguarding`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/athlete/safeguarding/page.tsx`](src/app/(portal)/p/[slug]/athlete/safeguarding/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-035 Athlete wellbeing & safeguarding (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Training  `/p/[slug]/athlete/training`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/athlete/training/page.tsx`](src/app/(portal)/p/[slug]/athlete/training/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Visa  `/p/[slug]/athlete/visa`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/athlete/visa/page.tsx`](src/app/(portal)/p/[slug]/athlete/visa/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### GVTEWAY · client — 7 pages

### Client  `/p/[slug]/client`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/client/page.tsx`](src/app/(portal)/p/[slug]/client/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Deliverables  `/p/[slug]/client/deliverables`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/client/deliverables/page.tsx`](src/app/(portal)/p/[slug]/client/deliverables/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Files  `/p/[slug]/client/files`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/client/files/page.tsx`](src/app/(portal)/p/[slug]/client/files/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Invoices  `/p/[slug]/client/invoices`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/client/invoices/page.tsx`](src/app/(portal)/p/[slug]/client/invoices/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Messages  `/p/[slug]/client/messages`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/client/messages/page.tsx`](src/app/(portal)/p/[slug]/client/messages/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Privacy  `/p/[slug]/client/privacy`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/client/privacy/page.tsx`](src/app/(portal)/p/[slug]/client/privacy/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Proposals  `/p/[slug]/client/proposals`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/client/proposals/page.tsx`](src/app/(portal)/p/[slug]/client/proposals/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### GVTEWAY · crew — 4 pages

### Crew  `/p/[slug]/crew`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/crew/page.tsx`](src/app/(portal)/p/[slug]/crew/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Advances  `/p/[slug]/crew/advances`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/crew/advances/page.tsx`](src/app/(portal)/p/[slug]/crew/advances/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Call sheet  `/p/[slug]/crew/call-sheet`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/crew/call-sheet/page.tsx`](src/app/(portal)/p/[slug]/crew/call-sheet/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Time  `/p/[slug]/crew/time`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/crew/time/page.tsx`](src/app/(portal)/p/[slug]/crew/time/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### GVTEWAY · delegation — 10 pages

### Delegation portal  `/p/[slug]/delegation`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/delegation/page.tsx`](src/app/(portal)/p/[slug]/delegation/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-040 NOC services & attaché program (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Accommodation  `/p/[slug]/delegation/accommodation`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/delegation/accommodation/page.tsx`](src/app/(portal)/p/[slug]/delegation/accommodation/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Training bookings  `/p/[slug]/delegation/bookings`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/delegation/bookings/page.tsx`](src/app/(portal)/p/[slug]/delegation/bookings/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-033 Training venue access & bookings (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Cases  `/p/[slug]/delegation/cases`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/delegation/cases/page.tsx`](src/app/(portal)/p/[slug]/delegation/cases/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-028 Protests, appeals & juries (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Entries  `/p/[slug]/delegation/entries`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/delegation/entries/page.tsx`](src/app/(portal)/p/[slug]/delegation/entries/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-021 Qualification system & entries (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Meetings  `/p/[slug]/delegation/meetings`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/delegation/meetings/page.tsx`](src/app/(portal)/p/[slug]/delegation/meetings/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-042 IF technical meetings & team leaders' meetings (P2); WF-043 Chef de Mission seminar & CdM-OCOG interface (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Privacy  `/p/[slug]/delegation/privacy`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/delegation/privacy/page.tsx`](src/app/(portal)/p/[slug]/delegation/privacy/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-232 Data protection & privacy compliance (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Rate card  `/p/[slug]/delegation/ratecard`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/delegation/ratecard/page.tsx`](src/app/(portal)/p/[slug]/delegation/ratecard/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-041 Team delegation registration & rate card (P1); WF-200 Sport equipment & rate card logistics (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Transport  `/p/[slug]/delegation/transport`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/delegation/transport/page.tsx`](src/app/(portal)/p/[slug]/delegation/transport/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-071 Athlete & team transport (T1/T2) (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Visa  `/p/[slug]/delegation/visa`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/delegation/visa/page.tsx`](src/app/(portal)/p/[slug]/delegation/visa/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-256 Border / visa / immigration facilitation (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### GVTEWAY · guest — 5 pages

### Guest  `/p/[slug]/guest`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/guest/page.tsx`](src/app/(portal)/p/[slug]/guest/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Logistics  `/p/[slug]/guest/logistics`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/guest/logistics/page.tsx`](src/app/(portal)/p/[slug]/guest/logistics/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Privacy  `/p/[slug]/guest/privacy`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/guest/privacy/page.tsx`](src/app/(portal)/p/[slug]/guest/privacy/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Schedule  `/p/[slug]/guest/schedule`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/guest/schedule/page.tsx`](src/app/(portal)/p/[slug]/guest/schedule/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Tickets  `/p/[slug]/guest/tickets`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/guest/tickets/page.tsx`](src/app/(portal)/p/[slug]/guest/tickets/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Workflows:** WF-175 Ticketing sales channels (public, NOC, sponsor) (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### GVTEWAY · guide — 1 pages

### Event guide  `/p/[slug]/guide`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/guide/page.tsx`](src/app/(portal)/p/[slug]/guide/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### GVTEWAY · hospitality — 3 pages

### Hospitality portal  `/p/[slug]/hospitality`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/hospitality/page.tsx`](src/app/(portal)/p/[slug]/hospitality/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-173 Hospitality program (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Guests  `/p/[slug]/hospitality/guests`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/hospitality/guests/page.tsx`](src/app/(portal)/p/[slug]/hospitality/guests/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Itinerary  `/p/[slug]/hospitality/itinerary`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/hospitality/itinerary/page.tsx`](src/app/(portal)/p/[slug]/hospitality/itinerary/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### GVTEWAY · media — 6 pages

### Media portal  `/p/[slug]/media`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/media/page.tsx`](src/app/(portal)/p/[slug]/media/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-120 Main Press Centre (MPC) operations (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Media accommodation  `/p/[slug]/media/accommodation`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/media/accommodation/page.tsx`](src/app/(portal)/p/[slug]/media/accommodation/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-081 Media Village / media housing (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Info-on-demand  `/p/[slug]/media/info`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/media/info/page.tsx`](src/app/(portal)/p/[slug]/media/info/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-122 Info-on-Demand / myInfo / News distribution (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Press conferences  `/p/[slug]/media/pressconf`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/media/pressconf/page.tsx`](src/app/(portal)/p/[slug]/media/pressconf/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-121 Venue press operations & press conferences (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Media services  `/p/[slug]/media/services`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/media/services/page.tsx`](src/app/(portal)/p/[slug]/media/services/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-112 Rights Holding Broadcaster (RHB) services (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Media transport  `/p/[slug]/media/transport`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/media/transport/page.tsx`](src/app/(portal)/p/[slug]/media/transport/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-073 Media transport (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### GVTEWAY · overview — 2 pages

### projectName  `/p/[slug]`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/page.tsx`](src/app/(portal)/p/[slug]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Project overview  `/p/[slug]/overview`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/overview/page.tsx`](src/app/(portal)/p/[slug]/overview/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### GVTEWAY · sponsor — 6 pages

### Sponsor  `/p/[slug]/sponsor`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/sponsor/page.tsx`](src/app/(portal)/p/[slug]/sponsor/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Workflows:** WF-170 TOP partner servicing (Worldwide Olympic Partners) (P1); WF-171 Domestic sponsor program & activation rights (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Activations  `/p/[slug]/sponsor/activations`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/sponsor/activations/page.tsx`](src/app/(portal)/p/[slug]/sponsor/activations/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Assets  `/p/[slug]/sponsor/assets`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/sponsor/assets/page.tsx`](src/app/(portal)/p/[slug]/sponsor/assets/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Entitlements  `/p/[slug]/sponsor/entitlements`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/sponsor/entitlements/page.tsx`](src/app/(portal)/p/[slug]/sponsor/entitlements/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Privacy  `/p/[slug]/sponsor/privacy`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/sponsor/privacy/page.tsx`](src/app/(portal)/p/[slug]/sponsor/privacy/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Reporting  `/p/[slug]/sponsor/reporting`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/sponsor/reporting/page.tsx`](src/app/(portal)/p/[slug]/sponsor/reporting/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### GVTEWAY · vendor — 8 pages

### Vendor  `/p/[slug]/vendor`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/vendor/page.tsx`](src/app/(portal)/p/[slug]/vendor/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Workflows:** WF-193 Contractor management (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Credentials  `/p/[slug]/vendor/credentials`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/vendor/credentials/page.tsx`](src/app/(portal)/p/[slug]/vendor/credentials/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Equipment pull list  `/p/[slug]/vendor/equipment-pull-list`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/vendor/equipment-pull-list/page.tsx`](src/app/(portal)/p/[slug]/vendor/equipment-pull-list/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Invoices  `/p/[slug]/vendor/invoices`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/vendor/invoices/page.tsx`](src/app/(portal)/p/[slug]/vendor/invoices/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Privacy  `/p/[slug]/vendor/privacy`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/vendor/privacy/page.tsx`](src/app/(portal)/p/[slug]/vendor/privacy/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Purchase orders  `/p/[slug]/vendor/purchase-orders`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/vendor/purchase-orders/page.tsx`](src/app/(portal)/p/[slug]/vendor/purchase-orders/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Submissions  `/p/[slug]/vendor/submissions`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** bespoke
- **Source:** [`src/app/(portal)/p/[slug]/vendor/submissions/page.tsx`](src/app/(portal)/p/[slug]/vendor/submissions/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Training  `/p/[slug]/vendor/training`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/vendor/training/page.tsx`](src/app/(portal)/p/[slug]/vendor/training/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### GVTEWAY · vip — 4 pages

### VIP portal  `/p/[slug]/vip`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/vip/page.tsx`](src/app/(portal)/p/[slug]/vip/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-152 Olympic protocol & dignitary management (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Accommodation  `/p/[slug]/vip/accommodation`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/vip/accommodation/page.tsx`](src/app/(portal)/p/[slug]/vip/accommodation/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-080 Olympic Family hotel program (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Itinerary  `/p/[slug]/vip/itinerary`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/vip/itinerary/page.tsx`](src/app/(portal)/p/[slug]/vip/itinerary/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Transport  `/p/[slug]/vip/transport`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/vip/transport/page.tsx`](src/app/(portal)/p/[slug]/vip/transport/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-072 Olympic Family transport (T3) fleet (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### GVTEWAY · volunteer — 5 pages

### Volunteer portal  `/p/[slug]/volunteer`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/volunteer/page.tsx`](src/app/(portal)/p/[slug]/volunteer/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-192 Volunteer program (recruitment → deployment) (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Application  `/p/[slug]/volunteer/application`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/volunteer/application/page.tsx`](src/app/(portal)/p/[slug]/volunteer/application/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Schedule  `/p/[slug]/volunteer/schedule`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/volunteer/schedule/page.tsx`](src/app/(portal)/p/[slug]/volunteer/schedule/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-197 Scheduling, shifts & time attendance (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Training  `/p/[slug]/volunteer/training`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/volunteer/training/page.tsx`](src/app/(portal)/p/[slug]/volunteer/training/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-196 Training & certification (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Uniform  `/p/[slug]/volunteer/uniform`
- **Atomic:** Page · **Platform:** GVTEWAY · **Template:** info
- **Source:** [`src/app/(portal)/p/[slug]/volunteer/uniform/page.tsx`](src/app/(portal)/p/[slug]/volunteer/uniform/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-194 Uniform distribution & rate card (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** persona-authenticated for this org slug
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


### COMPVSS — 36 pages

#### COMPVSS · ad — 1 pages

### Arrivals & departures  `/m/ad`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/ad/page.tsx`](src/app/(mobile)/m/ad/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-031 Athlete arrival & departure (A&D) (P0); WF-076 Airport arrivals / departures operations (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · alerts — 1 pages

### Alerts  `/m/alerts`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/alerts/page.tsx`](src/app/(mobile)/m/alerts/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-252 Crisis communications (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · check-in — 3 pages

### (mobile)/m/check-in/page.tsx  `/m/check-in`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** bespoke
- **Source:** [`src/app/(mobile)/m/check-in/page.tsx`](src/app/(mobile)/m/check-in/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### (mobile)/m/check-in/manual/page.tsx  `/m/check-in/manual`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** bespoke
- **Source:** [`src/app/(mobile)/m/check-in/manual/page.tsx`](src/app/(mobile)/m/check-in/manual/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### (mobile)/m/check-in/scan/[slug]/page.tsx  `/m/check-in/scan/[slug]`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** bespoke
- **Source:** [`src/app/(mobile)/m/check-in/scan/[slug]/page.tsx`](src/app/(mobile)/m/check-in/scan/[slug]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### COMPVSS · checkin — 1 pages

### Check-in  `/m/checkin`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/checkin/page.tsx`](src/app/(mobile)/m/checkin/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-195 Workforce services (meals, breaks, check-in/out) (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · coc — 1 pages

### Chain of custody  `/m/coc`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/coc/page.tsx`](src/app/(mobile)/m/coc/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-101 Sample collection (urine / blood / DBS) (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · crew — 2 pages

### (mobile)/m/crew/page.tsx  `/m/crew`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** bespoke
- **Source:** [`src/app/(mobile)/m/crew/page.tsx`](src/app/(mobile)/m/crew/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### (mobile)/m/crew/clock/page.tsx  `/m/crew/clock`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** bespoke
- **Source:** [`src/app/(mobile)/m/crew/clock/page.tsx`](src/app/(mobile)/m/crew/clock/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### COMPVSS · driver — 2 pages

### Driver  `/m/driver`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/driver/page.tsx`](src/app/(mobile)/m/driver/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-071 Athlete & team transport (T1/T2) (P0); WF-072 Olympic Family transport (T3) fleet (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Run  `/m/driver/run/[runId]`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/driver/run/[runId]/page.tsx`](src/app/(mobile)/m/driver/run/[runId]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · gate — 2 pages

### Gate  `/m/gate`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/gate/page.tsx`](src/app/(mobile)/m/gate/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-053 Access control & zone management (gates) (P0); WF-176 Ticket access control & secondary market controls (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Scan  `/m/gate/scan`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/gate/scan/page.tsx`](src/app/(mobile)/m/gate/scan/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · guard — 1 pages

### Guard  `/m/guard`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/guard/page.tsx`](src/app/(mobile)/m/guard/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-062 Venue security (screening, guarding, patrol) (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · guide — 1 pages

### guide.title  `/m/guide`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** bespoke
- **Source:** [`src/app/(mobile)/m/guide/page.tsx`](src/app/(mobile)/m/guide/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Workflows:** WF-015 Venue Operations Plan (VOP) (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### COMPVSS · handover — 1 pages

### Handover  `/m/handover`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/handover/page.tsx`](src/app/(mobile)/m/handover/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-013 Venue commissioning & handover (OCOG takeover) (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · incident — 2 pages

### Incident  `/m/incident`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/incident/page.tsx`](src/app/(mobile)/m/incident/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-065 Crisis / major incident response (P0); WF-094 Heat / environmental response (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### New incident  `/m/incident/new`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/incident/new/page.tsx`](src/app/(mobile)/m/incident/new/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · incidents — 1 pages

### (mobile)/m/incidents/new/page.tsx  `/m/incidents/new`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** bespoke
- **Source:** [`src/app/(mobile)/m/incidents/new/page.tsx`](src/app/(mobile)/m/incidents/new/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### COMPVSS · inventory — 1 pages

### (mobile)/m/inventory/scan/page.tsx  `/m/inventory/scan`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** bespoke
- **Source:** [`src/app/(mobile)/m/inventory/scan/page.tsx`](src/app/(mobile)/m/inventory/scan/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### COMPVSS · m — 1 pages

### (mobile)/m/page.tsx  `/m`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** bespoke
- **Source:** [`src/app/(mobile)/m/page.tsx`](src/app/(mobile)/m/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### COMPVSS · medic — 2 pages

### Medic  `/m/medic`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/medic/page.tsx`](src/app/(mobile)/m/medic/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-092 Venue medical services (FOP to spectator) (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### New encounter  `/m/medic/new`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/medic/new/page.tsx`](src/app/(mobile)/m/medic/new/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · notifications — 1 pages

### Notifications  `/m/notifications`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/notifications/page.tsx`](src/app/(mobile)/m/notifications/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-250 Internal communications (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · punch — 1 pages

### Punch list  `/m/punch`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/punch/page.tsx`](src/app/(mobile)/m/punch/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-012 Venue construction / fit-out oversight (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · requests — 1 pages

### Requests  `/m/requests`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/requests/page.tsx`](src/app/(mobile)/m/requests/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-032 Village resident services (dining, laundry, leisure) (P2); WF-203 Waste & cleaning operations (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · ros — 2 pages

### Run of show  `/m/ros`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/ros/page.tsx`](src/app/(mobile)/m/ros/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-017 Venue daily run of show / EOD / BOD (P1); WF-025 Sport presentation & in-venue show (P1); WF-029 Victory / medal ceremonies (event) (P1); WF-034 Team welcome ceremonies & flag raising (P2); WF-114 Mixed zone & post-event broadcast operations (P2); WF-150 Opening ceremony (P1); WF-151 Closing ceremony & flag handover (P1); WF-154 Medal design, production, and ceremony logistics (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Show  `/m/ros/[showId]`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/ros/[showId]/page.tsx`](src/app/(mobile)/m/ros/[showId]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · safeguarding — 1 pages

### Safeguarding  `/m/safeguarding`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/safeguarding/page.tsx`](src/app/(mobile)/m/safeguarding/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-035 Athlete wellbeing & safeguarding (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · settings — 1 pages

### (mobile)/m/settings/page.tsx  `/m/settings`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** form
- **Source:** [`src/app/(mobile)/m/settings/page.tsx`](src/app/(mobile)/m/settings/page.tsx)
- **Capabilities:** render-header, auth-guard, form-submit, validate-required
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FormShell, Input*, Select*, Button[type=submit]


#### COMPVSS · shift — 2 pages

### Shift  `/m/shift`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/shift/page.tsx`](src/app/(mobile)/m/shift/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-074 Workforce transport (P1); WF-192 Volunteer program (recruitment → deployment) (P0); WF-197 Scheduling, shifts & time attendance (P0)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Swap shift  `/m/shift/swap`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/shift/swap/page.tsx`](src/app/(mobile)/m/shift/swap/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · tasks — 1 pages

### (mobile)/m/tasks/page.tsx  `/m/tasks`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** bespoke
- **Source:** [`src/app/(mobile)/m/tasks/page.tsx`](src/app/(mobile)/m/tasks/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** tasks · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### COMPVSS · wallet — 1 pages

### My credential  `/m/wallet`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/wallet/page.tsx`](src/app/(mobile)/m/wallet/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-052 Accreditation card production & distribution (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · wayfind — 1 pages

### Wayfinding  `/m/wayfind`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/wayfind/page.tsx`](src/app/(mobile)/m/wayfind/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-181 Venue spectator journey & wayfinding (P2)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### COMPVSS · wms — 1 pages

### Warehouse  `/m/wms`
- **Atomic:** Page · **Platform:** COMPVSS · **Template:** info
- **Source:** [`src/app/(mobile)/m/wms/page.tsx`](src/app/(mobile)/m/wms/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Workflows:** WF-202 Venue materials, FF&E, warehousing (P1)
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** any authenticated user with an org membership
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


### Marketing — 27 pages

#### Marketing ·  — 1 pages

### Live product preview — MMW26 Hialeah guest guide  `/`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/page.tsx`](src/app/(marketing)/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · [competitor] — 1 pages

### Try Second Star Technologies  `/compare/[competitor]`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/compare/[competitor]/page.tsx`](src/app/(marketing)/compare/[competitor]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · [industry] — 1 pages

### `${info.name  `/solutions/[industry]`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/solutions/[industry]/page.tsx`](src/app/(marketing)/solutions/[industry]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · [module] — 1 pages

### Ship this module on show day  `/features/[module]`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/features/[module]/page.tsx`](src/app/(marketing)/features/[module]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · [slug] — 4 pages

### Run your next show on Second Star Technologies  `/blog/[slug]`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/blog/[slug]/page.tsx`](src/app/(marketing)/blog/[slug]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Ship your next show on Second Star Technologies  `/community/[slug]`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/community/[slug]/page.tsx`](src/app/(marketing)/community/[slug]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Case study  `/customers/[slug]`
- **Atomic:** Page · **Platform:** Marketing · **Template:** info
- **Source:** [`src/app/(marketing)/customers/[slug]/page.tsx`](src/app/(marketing)/customers/[slug]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Run your ops on Second Star Technologies  `/guides/[slug]`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/guides/[slug]/page.tsx`](src/app/(marketing)/guides/[slug]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · about — 1 pages

### Try the platform  `/about`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/about/page.tsx`](src/app/(marketing)/about/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · atlvs — 1 pages

### ATLVS · FAQ  `/solutions/atlvs`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/solutions/atlvs/page.tsx`](src/app/(marketing)/solutions/atlvs/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · blog — 1 pages

### (marketing)/blog/page.tsx  `/blog`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/blog/page.tsx`](src/app/(marketing)/blog/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · changelog — 1 pages

### Try what's new  `/changelog`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/changelog/page.tsx`](src/app/(marketing)/changelog/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · community — 1 pages

### Be the next story  `/community`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/community/page.tsx`](src/app/(marketing)/community/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · compare — 1 pages

### Try Second Star Technologies  `/compare`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/compare/page.tsx`](src/app/(marketing)/compare/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · compvss — 1 pages

### COMPVSS · FAQ  `/solutions/compvss`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/solutions/compvss/page.tsx`](src/app/(marketing)/solutions/compvss/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · contact — 1 pages

### Contact FAQ  `/contact`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/contact/page.tsx`](src/app/(marketing)/contact/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · customers — 1 pages

### Customers  `/customers`
- **Atomic:** Page · **Platform:** Marketing · **Template:** info
- **Source:** [`src/app/(marketing)/customers/page.tsx`](src/app/(marketing)/customers/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### Marketing · docs — 1 pages

### (marketing)/docs/page.tsx  `/docs`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/docs/page.tsx`](src/app/(marketing)/docs/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · dpa — 1 pages

### (marketing)/legal/dpa/page.tsx  `/legal/dpa`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/legal/dpa/page.tsx`](src/app/(marketing)/legal/dpa/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · features — 1 pages

### Everything in ATLVS, GVTEWAY, and COMPVSS  `/features`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/features/page.tsx`](src/app/(marketing)/features/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · guides — 1 pages

### Ship your ops  `/guides`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/guides/page.tsx`](src/app/(marketing)/guides/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · gvteway — 1 pages

### GVTEWAY · FAQ  `/solutions/gvteway`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/solutions/gvteway/page.tsx`](src/app/(marketing)/solutions/gvteway/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · pricing — 1 pages

### Pricing FAQ  `/pricing`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/pricing/page.tsx`](src/app/(marketing)/pricing/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · privacy — 1 pages

### (marketing)/legal/privacy/page.tsx  `/legal/privacy`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/legal/privacy/page.tsx`](src/app/(marketing)/legal/privacy/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · sla — 1 pages

### (marketing)/legal/sla/page.tsx  `/legal/sla`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/legal/sla/page.tsx`](src/app/(marketing)/legal/sla/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · solutions — 1 pages

### Solutions · FAQ  `/solutions`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/solutions/page.tsx`](src/app/(marketing)/solutions/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Marketing · terms — 1 pages

### (marketing)/legal/terms/page.tsx  `/legal/terms`
- **Atomic:** Page · **Platform:** Marketing · **Template:** bespoke
- **Source:** [`src/app/(marketing)/legal/terms/page.tsx`](src/app/(marketing)/legal/terms/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** anyone
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


### Auth — 11 pages

#### Auth · [provider] — 1 pages

### SSO  `/sso/[provider]`
- **Atomic:** Page · **Platform:** Auth · **Template:** info
- **Source:** [`src/app/(auth)/sso/[provider]/page.tsx`](src/app/(auth)/sso/[provider]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** unauthenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### Auth · [token] — 4 pages

### (auth)/accept-invite/[token]/page.tsx  `/accept-invite/[token]`
- **Atomic:** Page · **Platform:** Auth · **Template:** bespoke
- **Source:** [`src/app/(auth)/accept-invite/[token]/page.tsx`](src/app/(auth)/accept-invite/[token]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** unauthenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### Signing you in…  `/magic-link/[token]`
- **Atomic:** Page · **Platform:** Auth · **Template:** info
- **Source:** [`src/app/(auth)/magic-link/[token]/page.tsx`](src/app/(auth)/magic-link/[token]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** unauthenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Reset password  `/reset-password/[token]`
- **Atomic:** Page · **Platform:** Auth · **Template:** info
- **Source:** [`src/app/(auth)/reset-password/[token]/page.tsx`](src/app/(auth)/reset-password/[token]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** unauthenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface

### Verify email  `/verify-email/[token]`
- **Atomic:** Page · **Platform:** Auth · **Template:** info
- **Source:** [`src/app/(auth)/verify-email/[token]/page.tsx`](src/app/(auth)/verify-email/[token]/page.tsx)
- **Capabilities:** render-header, auth-guard, descriptive-text
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** unauthenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → ProseSurface


#### Auth · forgot-password — 1 pages

### (auth)/forgot-password/page.tsx  `/forgot-password`
- **Atomic:** Page · **Platform:** Auth · **Template:** bespoke
- **Source:** [`src/app/(auth)/forgot-password/page.tsx`](src/app/(auth)/forgot-password/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** unauthenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Auth · login — 1 pages

### (auth)/login/page.tsx  `/login`
- **Atomic:** Page · **Platform:** Auth · **Template:** bespoke
- **Source:** [`src/app/(auth)/login/page.tsx`](src/app/(auth)/login/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** unauthenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Auth · magic-link — 1 pages

### (auth)/magic-link/page.tsx  `/magic-link`
- **Atomic:** Page · **Platform:** Auth · **Template:** bespoke
- **Source:** [`src/app/(auth)/magic-link/page.tsx`](src/app/(auth)/magic-link/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** unauthenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Auth · reset-password — 1 pages

### (auth)/reset-password/page.tsx  `/reset-password`
- **Atomic:** Page · **Platform:** Auth · **Template:** bespoke
- **Source:** [`src/app/(auth)/reset-password/page.tsx`](src/app/(auth)/reset-password/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** unauthenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Auth · signup — 1 pages

### (auth)/signup/page.tsx  `/signup`
- **Atomic:** Page · **Platform:** Auth · **Template:** bespoke
- **Source:** [`src/app/(auth)/signup/page.tsx`](src/app/(auth)/signup/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** unauthenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Auth · verify-email — 1 pages

### (auth)/verify-email/page.tsx  `/verify-email`
- **Atomic:** Page · **Platform:** Auth · **Template:** bespoke
- **Source:** [`src/app/(auth)/verify-email/page.tsx`](src/app/(auth)/verify-email/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** unauthenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


### Personal — 9 pages

#### Personal · me — 1 pages

### (personal)/me/page.tsx  `/me`
- **Atomic:** Page · **Platform:** Personal · **Template:** form
- **Source:** [`src/app/(personal)/me/page.tsx`](src/app/(personal)/me/page.tsx)
- **Capabilities:** render-header, auth-guard, form-submit, validate-required
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** authenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FormShell, Input*, Select*, Button[type=submit]


#### Personal · notifications — 1 pages

### (personal)/me/notifications/page.tsx  `/me/notifications`
- **Atomic:** Page · **Platform:** Personal · **Template:** bespoke
- **Source:** [`src/app/(personal)/me/notifications/page.tsx`](src/app/(personal)/me/notifications/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** authenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Personal · organizations — 1 pages

### No memberships yet  `/me/organizations`
- **Atomic:** Page · **Platform:** Personal · **Template:** bespoke
- **Source:** [`src/app/(personal)/me/organizations/page.tsx`](src/app/(personal)/me/organizations/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** authenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Personal · privacy — 1 pages

### (personal)/me/privacy/page.tsx  `/me/privacy`
- **Atomic:** Page · **Platform:** Personal · **Template:** bespoke
- **Source:** [`src/app/(personal)/me/privacy/page.tsx`](src/app/(personal)/me/privacy/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** authenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Personal · profile — 1 pages

### (personal)/me/profile/page.tsx  `/me/profile`
- **Atomic:** Page · **Platform:** Personal · **Template:** bespoke
- **Source:** [`src/app/(personal)/me/profile/page.tsx`](src/app/(personal)/me/profile/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** authenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Personal · security — 1 pages

### (personal)/me/security/page.tsx  `/me/security`
- **Atomic:** Page · **Platform:** Personal · **Template:** form
- **Source:** [`src/app/(personal)/me/security/page.tsx`](src/app/(personal)/me/security/page.tsx)
- **Capabilities:** render-header, auth-guard, form-submit, validate-required
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** authenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → FormShell, Input*, Select*, Button[type=submit]


#### Personal · settings — 2 pages

### (personal)/me/settings/page.tsx  `/me/settings`
- **Atomic:** Page · **Platform:** Personal · **Template:** bespoke
- **Source:** [`src/app/(personal)/me/settings/page.tsx`](src/app/(personal)/me/settings/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** authenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)

### (personal)/me/settings/appearance/page.tsx  `/me/settings/appearance`
- **Atomic:** Page · **Platform:** Personal · **Template:** bespoke
- **Source:** [`src/app/(personal)/me/settings/appearance/page.tsx`](src/app/(personal)/me/settings/appearance/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** authenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


#### Personal · tickets — 1 pages

### (personal)/me/tickets/page.tsx  `/me/tickets`
- **Atomic:** Page · **Platform:** Personal · **Template:** bespoke
- **Source:** [`src/app/(personal)/me/tickets/page.tsx`](src/app/(personal)/me/tickets/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** authenticated
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


### Other — 1 pages

#### Other · [token] — 1 pages

### proposals/[token]/page.tsx  `/proposals/[token]`
- **Atomic:** Page · **Platform:** Other · **Template:** bespoke
- **Source:** [`src/app/proposals/[token]/page.tsx`](src/app/proposals/[token]/page.tsx)
- **Capabilities:** render-header, auth-guard, bespoke-logic
- **Upstream:** — · **Downstream:** —
- **RBAC visible:** unknown
  - *Section:* **PageChrome** → Breadcrumbs, ModuleHeader
  - *Section:* **PageContent** → (page-specific — inspect source)


## Quality flags

### Orphaned elements
Pages in a product shell (ATLVS/GVTEWAY/COMPVSS) with **zero workflow memberships**. These are shell navigation / hub / informational surfaces that exist for UX but aren't tied to an Olympic workflow. That's expected — hubs + aux pages don't need workflow bindings.

Count: **128**
- `/m/driver/run/[runId]`
- `/m/gate/scan`
- `/m/incident/new`
- `/m/medic/new`
- `/m/ros/[showId]`
- `/m/settings`
- `/m/shift/swap`
- `/console/accommodation/blocks/[blockId]`
- `/console/accommodation`
- `/console/accreditation/categories`
- `/console/accreditation/changes/[changeId]`
- `/console/accreditation`
- `/console/accreditation/vetting/[applicationId]`
- `/console/accreditation/zones`
- `/console/ai/agents`
- `/console/ai/assistant/[conversationId]`
- `/console/ai/automations/[automationId]`
- `/console/ai/automations/new`
- `/console/ai/automations`
- `/console/campaigns`
- `/console/clients/[clientId]`
- `/console/clients`
- `/console/commercial/hospitality/[packageId]`
- `/console/commercial`
- `/console/commercial/sponsors/[sponsorId]`
- `/console/commercial/tickets/[ticketTypeId]`
- `/console/comms/internal/new`
- `/console/comms`
- `/console/events`
- `/console/finance/advances`
- `/console/finance/expenses`
- `/console/finance/invoices/[invoiceId]`
- `/console/finance/invoices`
- `/console/finance/mileage`
- `/console/finance/payouts`
- `/console/finance/time`
- `/console/forms/[formId]`
- `/console/forms/new`
- `/console/forms`
- `/console/integrations/[connectorId]`
- `/console/kb/[articleId]`
- `/console/leads/[leadId]`
- `/console/leads`
- `/console/legal/ip/[markId]`
- `/console/legal`
- `/console/legal/privacy/consent`
- `/console/legal/privacy/datamap`
- `/console/legal/privacy/dsar/[requestId]`
- `/console/legal/privacy`
- `/console/locations`
- …and 78 more

### Dead-end workflows
Workflow surfaces referenced in the gap analysis that have **no corresponding page on disk**.

None — every in-scope workflow surface has a live page.

### Permission gaps
Pages with capabilities that lack explicit RBAC assignment.

None — every page inherits RBAC via its shell (ATLVS/GVTEWAY/COMPVSS/…) with tighter overrides for Legal, Medical PHI, and Safeguarding.

### Dangling dependencies
Pages whose upstream table does not exist in the Supabase types.

None.
