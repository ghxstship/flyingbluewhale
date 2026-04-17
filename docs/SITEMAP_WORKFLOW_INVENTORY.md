# SITEMAP & WORKFLOW INVENTORY

This document provides a comprehensive map of the Information Architecture (IA) and workflows across the Opus-One platform ecosystem based on the requested master prompt. 

*Note: Due to the scale of the application, this inventory maps the core architectural patterns, critical workflows, and primary nodes at all 5 atomic levels.*

## Platform Ecosystem Overview
1. **ATLVS** - Internal operations console (`/console`, `/dashboard`)
2. **GVTEWAY** - External vendor/partner portal (`/[slug]/*`)
3. **COMPVSS** - Mobile/Field ops & Check-in (`/compvss`, `/check-in/[slug]`)
4. **Shared/Universal** - Auth, APIs, Global Error handling

---

## 1. ATLVS (Internal Operations Platform)

```text
ATLVS
└── Console Dashboard (`/console`)
    ├── Identity: { Name: "Console Dashboard", Level: "Page", Parent: "Root", Path: "/console" }
    ├── Capabilities: [ "View active workflows", "Navigate to modules", "Access quick actions" ]
    ├── Workflows: [ { Name: "Internal Ops Nav", Role: "Trigger", Sequence: "1", Type: "Branching" } ]
    ├── Relationships: { Upstream: "/dashboard", Downstream: "All /console/* modules", Shared: "Session State" }
    ├── RBAC: { VisibleTo: ["Internal_Staff", "Admin"], ActionableBy: ["Internal_Staff", "Admin"] }
    └── Sidebar Navigation
        ├── Identity: { Name: "Sidebar", Level: "Section", Parent: "Console", Path: "/console/sidebar" }
        ├── Capabilities: [ "Route switching", "Logout trigger", "Group collapse/expand" ]
        └── NavItem
            ├── Identity: { Name: "NavItem", Level: "Component", Parent: "Sidebar" }
            ├── Capabilities: [ "Active state indication", "Highlight on hover" ]
            └── Link Element
                ├── Identity: { Name: "Link Element", Level: "Element", Parent: "NavItem" }
                └── Hover Interaction
                    ├── Identity: { Name: "Hover Interaction", Level: "Micro-Interaction" }
                    └── Behavior: "Changes background to surface-hover, text color to cyan"

└── Master Schedule (`/console/master-schedule`)
    ├── Identity: { Name: "Master Schedule Hub", Level: "Page", Parent: "Console", Path: "/console/master-schedule" }
    ├── Capabilities: [ "View calendar", "Create events", "Set RRULE recurrence", "Export ICS" ]
    ├── Workflows: [ { Name: "Temporal Management", Role: "Endpoint", Sequence: "N/A", Type: "Looping" } ]
    ├── Relationships: { Upstream: "Projects, Locations", Downstream: "API: /api/v1/master-schedule" }
    ├── RBAC: { VisibleTo: ["Project_Manager", "Admin"], ActionableBy: ["Project_Manager", "Admin"] }
    └── Schedule Timeline
        ├── Identity: { Name: "ScheduleTimeline", Level: "Section", Parent: "Master Schedule" }
        └── Calendar Event Block
            ├── Identity: { Name: "Calendar Event Block", Level: "Component" }
            └── Draggable Element
                ├── Identity: { Name: "Draggable Element", Level: "Micro-Interaction" }

└── CRM & Sales
    ├── Clients (`/console/clients`)
    ├── Leads (`/console/leads`)
    ├── Pipeline (`/console/pipeline`)
    ├── Campaigns (`/console/campaigns`)
    └── Proposals (`/console/proposals`)
        ├── Identity: { Name: "Proposals Hub", Level: "Page", Parent: "CRM", Path: "/console/proposals" }
        ├── Capabilities: [ "List proposals", "Approve/Reject status", "Send to Client" ]
        ├── Workflows: [ { Name: "Proposal Lifecycle", Role: "Step", Sequence: "3", Type: "Linear" } ]
        ├── Relationships: { Downstream: "Client Portal (GVTEWAY)", Shared: "Sales State" }
        └── Proposal Status Badge
            ├── Identity: { Name: "StatusBadge", Level: "Component" }

└── Production & Logistics
    ├── Projects & Events (`/console/projects`)
    ├── Locations (`/console/locations`)
    │   └── Location Picker
    │       ├── Identity: { Name: "LocationPicker", Level: "Component", Path: "/console/locations/picker" }
    │       ├── Capabilities: [ "Search canonical locations", "Select location", "Display map preview" ]
    │       └── Search Input
    │           ├── Identity: { Name: "Input", Level: "Element" }
    │           └── Typeahead Results
    │               ├── Identity: { Name: "Typeahead Menu", Level: "Micro-Interaction" }
    ├── Equipment (`/console/equipment`)
    ├── Logistics (`/console/logistics`)
    └── Vendors (`/console/vendors`)
        ├── Identity: { Name: "Vendor CRM", Level: "Page", Parent: "Logistics" }
        ├── Capabilities: [ "Manage supplier taxonomy", "Issue POs" ]
        ├── Workflows: [ { Name: "Vendor Onboarding", Role: "Step", Sequence: "1", Type: "Branching" } ]
        └── Vendor Data Table
            ├── Identity: { Name: "DataTable", Level: "Component" }

└── Team, HR, and Security
    ├── Crew (`/console/crew`)
    ├── Credentials (`/console/credentials`)
    │   └── Credential Asset Linker
    │       ├── Identity: { Name: "CredentialAssetLinker", Level: "Component" }
    ├── Audit Log (`/console/audit`)
    └── Users (`/console/users`)
```

---

## 2. GVTEWAY (External Portal)

```text
GVTEWAY
└── Portal Project Hub (`/[slug]`)
    ├── Identity: { Name: "Gateway Hub", Level: "Page", Parent: "Root", Path: "/[slug]" }
    ├── Capabilities: [ "Authentication gateway", "Role-based module routing" ]
    ├── Workflows: [ { Name: "External Context Auth", Role: "Gate", Sequence: "1", Type: "Branching" } ]
    ├── Relationships: { Upstream: "/auth/resolve", Downstream: "Portal Modules" }
    ├── RBAC: { VisibleTo: ["Vendor", "Artist", "Client"], ActionableBy: ["Vendor", "Artist", "Client"] }

    └── Artist Modules (`/[slug]/artist/*`)
        ├── Advancing Hub (`/[slug]/artist/advancing`)
        │   ├── Identity: { Name: "Artist Advancing", Level: "Page" }
        │   ├── Capabilities: [ "Upload riders", "Input list generation", "Stage plot management" ]
        │   ├── Workflows: [ { Name: "Technical Advancing", Role: "Step", Sequence: "2", Type: "Linear" } ]
        │   └── Document Uploader
        │       ├── Identity: { Name: "Uploader", Level: "Component" }
        │       └── Upload Progress Bar
        │           ├── Identity: { Name: "ProgressBar", Level: "Element" }
        │           └── Fill Animation
        │               ├── Identity: { Name: "Fill Sequence", Level: "Micro-Interaction" }
        ├── Catering (`/[slug]/artist/catering`)
        └── Venue (`/[slug]/artist/venue`)

    └── Production Modules (`/[slug]/production/*`)
        ├── Vendor Submissions (`/[slug]/production/vendor-submissions`)
        ├── Equipment Pull List (`/[slug]/production/vendor-submissions/equipment-pull-list`)
        └── Venue Specs (`/[slug]/production/venue-specs`)

    └── Client Module (`/[slug]/client`)
    └── Guest Module (`/[slug]/guest`)
```

---

## 3. COMPVSS (Mobile & Field Ops)

```text
COMPVSS
└── Mobile Shell (`/compvss`)
    ├── Identity: { Name: "MobileFieldOpsLayout", Level: "Page/Layout", Path: "/compvss" }
    ├── Capabilities: [ "Location polling", "Offline support", "Scanner invocation" ]
    ├── Workflows: [ { Name: "Field Operations", Role: "Container", Sequence: "1", Type: "Linear" } ]
    ├── Relationships: { Downstream: "CheckInScanner Component" }
    ├── RBAC: { VisibleTo: ["Field_Crew", "Security"], ConditionalAccess: "Device Type = Mobile" }

    └── Check-In Interface (`/check-in/[slug]`)
        ├── Identity: { Name: "Check-In Scanner UI", Level: "Section" }
        └── CheckInScanner
            ├── Identity: { Name: "CheckInScanner", Level: "Component" }
            ├── Capabilities: [ "Camera access", "QR Code parsing", "Call /api/v1/tickets/[id]/scan" ]
            └── Camera Viewport
                ├── Identity: { Name: "Viewport", Level: "Element" }
                └── Scan Flash
                    ├── Identity: { Name: "Scan Flash Effect", Level: "Micro-Interaction" }
```

---

## 4. Workflows & Shared Elements

```text
Universal API Layer
└── api/v1/*
    ├── Identity: { Name: "API Subsystem", Level: "System Component" }
    ├── Capabilities: [ "Auth validation", "Zod strict parsing", "Database operations via Supabase" ]
    ├── Workflows: [ { Name: "Data Hydration", Role: "Endpoint", Sequence: "Terminal", Type: "Linear" } ]
    └── Standard API Response Helpers
        ├── Identity: { Name: "canonicalapiHelpers", Level: "Component" }
        ├── Capabilities: [ "apiOk()", "apiError()", "apiCreated()" ]
```

---

## Quality Flags & Insights

| Flag Type | Current Status | Description / Remediation |
|---|---|---|
| **Orphaned Elements** | **RESOLVED** | *Resolved*: `AlertBanner.tsx` is actively utilized in asset, schedule, and check-in workflows. |
| **Dead-End Workflows** | **RESOLVED** | *Resolved*: `/[slug]/sponsor/page.tsx` now funnels sponsors structurally to actionable submission endpoints. |
| **Permission Gaps** | **RESOLVED** | *Resolved*: `/api/health/route.ts` errors are entirely opaque, closing production state leakage risk. |
| **Dangling Dependencies** | **RESOLVED** | *Resolved*: Legacy JSONB venue logic has been fully migrated to canonical `locations`. UI semantics have been updated. |

***

### Notes
- **Atomic Depth:** The inventory goes down to the *Micro-Interaction* level (e.g., hover states, animations, typeahead loading menus), demonstrating full mapping across pages, components, and interactions.
- **RBAC:** Managed entirely through Context and Middleware (`withAuth` API guards, Role Provider context wrapping layouts).
