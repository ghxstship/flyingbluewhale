# Site Map & Workflow Inventory: GVTEWAY

```text
GVTEWAY
└── [slug] Layout (`/(portal)/p/[slug]`)
    ├── Identity: { Name: "[slug] Layout", Level: "Layout", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]" }
    ├── Capabilities: [ Form Submission, Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "[slug] Layout Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── [slug] Layout Section
        ├── Identity: { Name: "[slug] Layout Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── artist Page (`/(portal)/p/[slug]/artist`)
    ├── Identity: { Name: "artist Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist" }
    ├── Capabilities: [ Navigation, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "artist Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Artist, Client ], ActionableBy: [ Artist, Client ] }
    └── artist Page Section
        ├── Identity: { Name: "artist Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── advancing Page (`/(portal)/p/[slug]/artist/advancing`)
    ├── Identity: { Name: "advancing Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist/advancing" }
    ├── Capabilities: [ Navigation, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "advancing Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Artist, Client ], ActionableBy: [ Artist, Client ] }
    └── advancing Page Section
        ├── Identity: { Name: "advancing Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── crew-list Page (`/(portal)/p/[slug]/artist/advancing/crew-list`)
    ├── Identity: { Name: "crew-list Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist/advancing/crew-list" }
    ├── Capabilities: [ Action Trigger ]
    ├── Workflows: [ { Name: "crew-list Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Artist ], ActionableBy: [ Artist ] }
    └── crew-list Page Section
        ├── Identity: { Name: "crew-list Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── guest-list Page (`/(portal)/p/[slug]/artist/advancing/guest-list`)
    ├── Identity: { Name: "guest-list Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist/advancing/guest-list" }
    ├── Capabilities: [ Navigation, Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "guest-list Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── guest-list Page Section
        ├── Identity: { Name: "guest-list Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── hospitality-rider Page (`/(portal)/p/[slug]/artist/advancing/hospitality-rider`)
    ├── Identity: { Name: "hospitality-rider Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist/advancing/hospitality-rider" }
    ├── Capabilities: [ Action Trigger ]
    ├── Workflows: [ { Name: "hospitality-rider Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── hospitality-rider Page Section
        ├── Identity: { Name: "hospitality-rider Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── input-list Page (`/(portal)/p/[slug]/artist/advancing/input-list`)
    ├── Identity: { Name: "input-list Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist/advancing/input-list" }
    ├── Capabilities: [ Action Trigger ]
    ├── Workflows: [ { Name: "input-list Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── input-list Page Section
        ├── Identity: { Name: "input-list Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── stage-plot Page (`/(portal)/p/[slug]/artist/advancing/stage-plot`)
    ├── Identity: { Name: "stage-plot Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist/advancing/stage-plot" }
    ├── Capabilities: [ Action Trigger ]
    ├── Workflows: [ { Name: "stage-plot Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── stage-plot Page Section
        ├── Identity: { Name: "stage-plot Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── technical-rider Page (`/(portal)/p/[slug]/artist/advancing/technical-rider`)
    ├── Identity: { Name: "technical-rider Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist/advancing/technical-rider" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "technical-rider Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── technical-rider Page Section
        ├── Identity: { Name: "technical-rider Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── catering Page (`/(portal)/p/[slug]/artist/catering`)
    ├── Identity: { Name: "catering Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist/catering" }
    ├── Capabilities: [ Form Submission, Action Trigger ]
    ├── Workflows: [ { Name: "catering Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Artist ], ActionableBy: [ Artist ] }
    └── catering Page Section
        ├── Identity: { Name: "catering Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── credentials Page (`/(portal)/p/[slug]/artist/credentials`)
    ├── Identity: { Name: "credentials Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist/credentials" }
    ├── Capabilities: [ Form Submission, Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "credentials Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Artist, Client ], ActionableBy: [ Artist, Client ] }
    └── credentials Page Section
        ├── Identity: { Name: "credentials Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── schedule Page (`/(portal)/p/[slug]/artist/schedule`)
    ├── Identity: { Name: "schedule Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist/schedule" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "schedule Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── schedule Page Section
        ├── Identity: { Name: "schedule Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── travel Page (`/(portal)/p/[slug]/artist/travel`)
    ├── Identity: { Name: "travel Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist/travel" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "travel Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── travel Page Section
        ├── Identity: { Name: "travel Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── venue Page (`/(portal)/p/[slug]/artist/venue`)
    ├── Identity: { Name: "venue Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/artist/venue" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── Workflows: [ { Name: "venue Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Artist, Client ], ActionableBy: [ Artist, Client ] }
    └── venue Page Section
        ├── Identity: { Name: "venue Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── attendee Page (`/(portal)/p/[slug]/attendee`)
    ├── Identity: { Name: "attendee Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/attendee" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "attendee Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── attendee Page Section
        ├── Identity: { Name: "attendee Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── client Page (`/(portal)/p/[slug]/client`)
    ├── Identity: { Name: "client Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/client" }
    ├── Capabilities: [ Navigation ]
    ├── Workflows: [ { Name: "client Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── client Page Section
        ├── Identity: { Name: "client Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── deliverables Page (`/(portal)/p/[slug]/client/deliverables`)
    ├── Identity: { Name: "deliverables Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/client/deliverables" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "deliverables Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── deliverables Page Section
        ├── Identity: { Name: "deliverables Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── files Page (`/(portal)/p/[slug]/client/files`)
    ├── Identity: { Name: "files Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/client/files" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "files Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── files Page Section
        ├── Identity: { Name: "files Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── invoices Page (`/(portal)/p/[slug]/client/invoices`)
    ├── Identity: { Name: "invoices Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/client/invoices" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "invoices Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── invoices Page Section
        ├── Identity: { Name: "invoices Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── messages Page (`/(portal)/p/[slug]/client/messages`)
    ├── Identity: { Name: "messages Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/client/messages" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "messages Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── messages Page Section
        ├── Identity: { Name: "messages Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── proposals Page (`/(portal)/p/[slug]/client/proposals`)
    ├── Identity: { Name: "proposals Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/client/proposals" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "proposals Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── proposals Page Section
        ├── Identity: { Name: "proposals Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── crew Page (`/(portal)/p/[slug]/crew`)
    ├── Identity: { Name: "crew Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/crew" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "crew Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── crew Page Section
        ├── Identity: { Name: "crew Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── advances Page (`/(portal)/p/[slug]/crew/advances`)
    ├── Identity: { Name: "advances Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/crew/advances" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "advances Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── advances Page Section
        ├── Identity: { Name: "advances Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── call-sheet Page (`/(portal)/p/[slug]/crew/call-sheet`)
    ├── Identity: { Name: "call-sheet Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/crew/call-sheet" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "call-sheet Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── call-sheet Page Section
        ├── Identity: { Name: "call-sheet Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── time Page (`/(portal)/p/[slug]/crew/time`)
    ├── Identity: { Name: "time Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/crew/time" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "time Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── time Page Section
        ├── Identity: { Name: "time Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── guest Page (`/(portal)/p/[slug]/guest`)
    ├── Identity: { Name: "guest Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/guest" }
    ├── Capabilities: [ Navigation ]
    ├── Workflows: [ { Name: "guest Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── guest Page Section
        ├── Identity: { Name: "guest Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── logistics Page (`/(portal)/p/[slug]/guest/logistics`)
    ├── Identity: { Name: "logistics Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/guest/logistics" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "logistics Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── logistics Page Section
        ├── Identity: { Name: "logistics Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── schedule Page (`/(portal)/p/[slug]/guest/schedule`)
    ├── Identity: { Name: "schedule Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/guest/schedule" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "schedule Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── schedule Page Section
        ├── Identity: { Name: "schedule Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── tickets Page (`/(portal)/p/[slug]/guest/tickets`)
    ├── Identity: { Name: "tickets Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/guest/tickets" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "tickets Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── tickets Page Section
        ├── Identity: { Name: "tickets Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── management Page (`/(portal)/p/[slug]/management`)
    ├── Identity: { Name: "management Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/management" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "management Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── management Page Section
        ├── Identity: { Name: "management Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── overview Page (`/(portal)/p/[slug]/overview`)
    ├── Identity: { Name: "overview Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/overview" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "overview Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── overview Page Section
        ├── Identity: { Name: "overview Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── press Page (`/(portal)/p/[slug]/press`)
    ├── Identity: { Name: "press Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/press" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "press Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── press Page Section
        ├── Identity: { Name: "press Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── production Page (`/(portal)/p/[slug]/production`)
    ├── Identity: { Name: "production Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/production" }
    ├── Capabilities: [ Navigation, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "production Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Client ], ActionableBy: [ Vendor, Client ] }
    └── production Page Section
        ├── Identity: { Name: "production Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── credentials Page (`/(portal)/p/[slug]/production/credentials`)
    ├── Identity: { Name: "credentials Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/production/credentials" }
    ├── Capabilities: [ Form Submission, Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "credentials Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Staff, Client ], ActionableBy: [ Vendor, Staff, Client ] }
    └── credentials Page Section
        ├── Identity: { Name: "credentials Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── equipment Page (`/(portal)/p/[slug]/production/equipment`)
    ├── Identity: { Name: "equipment Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/production/equipment" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "equipment Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── equipment Page Section
        ├── Identity: { Name: "equipment Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── lost-found Page (`/(portal)/p/[slug]/production/lost-found`)
    ├── Identity: { Name: "lost-found Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/production/lost-found" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "lost-found Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── lost-found Page Section
        ├── Identity: { Name: "lost-found Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── receiving Page (`/(portal)/p/[slug]/production/receiving`)
    ├── Identity: { Name: "receiving Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/production/receiving" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "receiving Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Client ], ActionableBy: [ Vendor, Client ] }
    └── receiving Page Section
        ├── Identity: { Name: "receiving Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── schedules Page (`/(portal)/p/[slug]/production/schedules`)
    ├── Identity: { Name: "schedules Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/production/schedules" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "schedules Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── schedules Page Section
        ├── Identity: { Name: "schedules Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── vendor-submissions Page (`/(portal)/p/[slug]/production/vendor-submissions`)
    ├── Identity: { Name: "vendor-submissions Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/production/vendor-submissions" }
    ├── Capabilities: [ Navigation ]
    ├── Workflows: [ { Name: "vendor-submissions Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Client ], ActionableBy: [ Vendor, Client ] }
    └── vendor-submissions Page Section
        ├── Identity: { Name: "vendor-submissions Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── equipment-pull-list Page (`/(portal)/p/[slug]/production/vendor-submissions/equipment-pull-list`)
    ├── Identity: { Name: "equipment-pull-list Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/production/vendor-submissions/equipment-pull-list" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "equipment-pull-list Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Client ], ActionableBy: [ Vendor, Client ] }
    └── equipment-pull-list Page Section
        ├── Identity: { Name: "equipment-pull-list Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── venue-specs Page (`/(portal)/p/[slug]/production/venue-specs`)
    ├── Identity: { Name: "venue-specs Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/production/venue-specs" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── Workflows: [ { Name: "venue-specs Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── venue-specs Page Section
        ├── Identity: { Name: "venue-specs Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── sponsor Page (`/(portal)/p/[slug]/sponsor`)
    ├── Identity: { Name: "sponsor Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/sponsor" }
    ├── Capabilities: [ Navigation ]
    ├── Workflows: [ { Name: "sponsor Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Staff ], ActionableBy: [ Staff ] }
    └── sponsor Page Section
        ├── Identity: { Name: "sponsor Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── [tab] Page (`/(portal)/p/[slug]/sponsor/[tab]`)
    ├── Identity: { Name: "[tab] Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/sponsor/[tab]" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "[tab] Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── [tab] Page Section
        ├── Identity: { Name: "[tab] Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── activations Page (`/(portal)/p/[slug]/sponsor/activations`)
    ├── Identity: { Name: "activations Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/sponsor/activations" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "activations Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── activations Page Section
        ├── Identity: { Name: "activations Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── assets Page (`/(portal)/p/[slug]/sponsor/assets`)
    ├── Identity: { Name: "assets Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/sponsor/assets" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "assets Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── assets Page Section
        ├── Identity: { Name: "assets Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── reporting Page (`/(portal)/p/[slug]/sponsor/reporting`)
    ├── Identity: { Name: "reporting Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/sponsor/reporting" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "reporting Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── reporting Page Section
        ├── Identity: { Name: "reporting Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── staff Page (`/(portal)/p/[slug]/staff`)
    ├── Identity: { Name: "staff Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/staff" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "staff Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Staff ], ActionableBy: [ Staff ] }
    └── staff Page Section
        ├── Identity: { Name: "staff Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── vendor Page (`/(portal)/p/[slug]/vendor`)
    ├── Identity: { Name: "vendor Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/vendor" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "vendor Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor ], ActionableBy: [ Vendor ] }
    └── vendor Page Section
        ├── Identity: { Name: "vendor Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── credentials Page (`/(portal)/p/[slug]/vendor/credentials`)
    ├── Identity: { Name: "credentials Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/vendor/credentials" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "credentials Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── credentials Page Section
        ├── Identity: { Name: "credentials Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── equipment-pull-list Page (`/(portal)/p/[slug]/vendor/equipment-pull-list`)
    ├── Identity: { Name: "equipment-pull-list Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/vendor/equipment-pull-list" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "equipment-pull-list Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── equipment-pull-list Page Section
        ├── Identity: { Name: "equipment-pull-list Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── invoices Page (`/(portal)/p/[slug]/vendor/invoices`)
    ├── Identity: { Name: "invoices Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/vendor/invoices" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "invoices Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── invoices Page Section
        ├── Identity: { Name: "invoices Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── purchase-orders Page (`/(portal)/p/[slug]/vendor/purchase-orders`)
    ├── Identity: { Name: "purchase-orders Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/vendor/purchase-orders" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "purchase-orders Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── purchase-orders Page Section
        ├── Identity: { Name: "purchase-orders Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── submissions Page (`/(portal)/p/[slug]/vendor/submissions`)
    ├── Identity: { Name: "submissions Page", Level: "Page", Parent: "GVTEWAY", Path: "/(portal)/p/[slug]/vendor/submissions" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "submissions Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── submissions Page Section
        ├── Identity: { Name: "submissions Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

```

## Quality Flags

| Flag Type | Finding |
|---|---|
| **Orphaned Elements** | 0 detected (AST limited to primary routing tree) |
| **Dead-End Workflows** | 29 pages lacking explicit action triggers |
| **Permission Gaps** | 0 routes relying on inherited/public ACLs |
| **Dangling Dependencies** | 0 strictly unresolved API calls |

### Dead-End Workflow Details
- `/(portal)/p/[slug]/artist/schedule`
- `/(portal)/p/[slug]/artist/travel`
- `/(portal)/p/[slug]/attendee`
- `/(portal)/p/[slug]/client/deliverables`
- `/(portal)/p/[slug]/client/files`
- `/(portal)/p/[slug]/client/invoices`
- `/(portal)/p/[slug]/client/messages`
- `/(portal)/p/[slug]/client/proposals`
- `/(portal)/p/[slug]/crew`
- `/(portal)/p/[slug]/crew/advances`
- *...and 19 more.*

