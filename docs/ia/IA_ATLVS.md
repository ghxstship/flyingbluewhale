# Site Map & Workflow Inventory: ATLVS

```text
ATLVS
└── (platform) Layout (`/(platform)`)
    ├── Identity: { Name: "(platform) Layout", Level: "Layout", Parent: "ATLVS", Path: "/(platform)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(platform) Layout Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (platform) Layout Section
        ├── Identity: { Name: "(platform) Layout Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── catalog Page (`/(platform)/catalog`)
    ├── Identity: { Name: "catalog Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/catalog" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── Workflows: [ { Name: "catalog Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── catalog Page Section
        ├── Identity: { Name: "catalog Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── catering Page (`/(platform)/catering`)
    ├── Identity: { Name: "catering Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/catering" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "catering Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── catering Page Section
        ├── Identity: { Name: "catering Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── cms Page (`/(platform)/cms`)
    ├── Identity: { Name: "cms Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/cms" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "cms Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── cms Page Section
        ├── Identity: { Name: "cms Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── console Layout (`/(platform)/console`)
    ├── Identity: { Name: "console Layout", Level: "Layout", Parent: "ATLVS", Path: "/(platform)/console" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── Workflows: [ { Name: "console Layout Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── console Layout Section
        ├── Identity: { Name: "console Layout Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── console Page (`/(platform)/console`)
    ├── Identity: { Name: "console Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "console Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── console Page Section
        ├── Identity: { Name: "console Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── ai Page (`/(platform)/console/ai`)
    ├── Identity: { Name: "ai Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/ai" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "ai Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── ai Page Section
        ├── Identity: { Name: "ai Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── agents Page (`/(platform)/console/ai/agents`)
    ├── Identity: { Name: "agents Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/ai/agents" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "agents Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── agents Page Section
        ├── Identity: { Name: "agents Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── [conversationId] Page (`/(platform)/console/ai/assistant/[conversationId]`)
    ├── Identity: { Name: "[conversationId] Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/ai/assistant/[conversationId]" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "[conversationId] Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── [conversationId] Page Section
        ├── Identity: { Name: "[conversationId] Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/ai/automations/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/ai/automations/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── drafting Page (`/(platform)/console/ai/drafting`)
    ├── Identity: { Name: "drafting Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/ai/drafting" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "drafting Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── drafting Page Section
        ├── Identity: { Name: "drafting Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── assets Page (`/(platform)/console/assets`)
    ├── Identity: { Name: "assets Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/assets" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "assets Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── assets Page Section
        ├── Identity: { Name: "assets Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── audit Page (`/(platform)/console/audit`)
    ├── Identity: { Name: "audit Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/audit" }
    ├── Capabilities: [ Action Trigger ]
    ├── Workflows: [ { Name: "audit Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── audit Page Section
        ├── Identity: { Name: "audit Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── budgets Page (`/(platform)/console/budgets`)
    ├── Identity: { Name: "budgets Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/budgets" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "budgets Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── budgets Page Section
        ├── Identity: { Name: "budgets Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── campaigns Page (`/(platform)/console/campaigns`)
    ├── Identity: { Name: "campaigns Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/campaigns" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "campaigns Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── campaigns Page Section
        ├── Identity: { Name: "campaigns Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── clients Page (`/(platform)/console/clients`)
    ├── Identity: { Name: "clients Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/clients" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "clients Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── clients Page Section
        ├── Identity: { Name: "clients Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── compliance Page (`/(platform)/console/compliance`)
    ├── Identity: { Name: "compliance Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/compliance" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "compliance Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── compliance Page Section
        ├── Identity: { Name: "compliance Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── credentials Page (`/(platform)/console/credentials`)
    ├── Identity: { Name: "credentials Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/credentials" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "credentials Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Staff, Client, Artist ], ActionableBy: [ Vendor, Staff, Client, Artist ] }
    └── credentials Page Section
        ├── Identity: { Name: "credentials Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── crew Page (`/(platform)/console/crew`)
    ├── Identity: { Name: "crew Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/crew" }
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

└── deliverables Page (`/(platform)/console/deliverables`)
    ├── Identity: { Name: "deliverables Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/deliverables" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "deliverables Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Artist, Client ], ActionableBy: [ Vendor, Artist, Client ] }
    └── deliverables Page Section
        ├── Identity: { Name: "deliverables Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── [id] Page (`/(platform)/console/deliverables/[id]`)
    ├── Identity: { Name: "[id] Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/deliverables/[id]" }
    ├── Capabilities: [ Form Submission, Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "[id] Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── [id] Page Section
        ├── Identity: { Name: "[id] Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── queue Page (`/(platform)/console/deliverables/queue`)
    ├── Identity: { Name: "queue Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/deliverables/queue" }
    ├── Capabilities: [ Navigation, Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "queue Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── queue Page Section
        ├── Identity: { Name: "queue Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── equipment Page (`/(platform)/console/equipment`)
    ├── Identity: { Name: "equipment Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/equipment" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "equipment Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── equipment Page Section
        ├── Identity: { Name: "equipment Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── expenses Page (`/(platform)/console/expenses`)
    ├── Identity: { Name: "expenses Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/expenses" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "expenses Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── expenses Page Section
        ├── Identity: { Name: "expenses Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── fabrication Page (`/(platform)/console/fabrication`)
    ├── Identity: { Name: "fabrication Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/fabrication" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "fabrication Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── fabrication Page Section
        ├── Identity: { Name: "fabrication Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── files Page (`/(platform)/console/files`)
    ├── Identity: { Name: "files Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/files" }
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

└── finance Page (`/(platform)/console/finance`)
    ├── Identity: { Name: "finance Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/finance" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "finance Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── finance Page Section
        ├── Identity: { Name: "finance Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/finance/advances/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/finance/advances/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/finance/budgets/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/finance/budgets/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/finance/expenses/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/finance/expenses/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/finance/invoices/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/finance/invoices/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/finance/mileage/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/finance/mileage/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── payouts Page (`/(platform)/console/finance/payouts`)
    ├── Identity: { Name: "payouts Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/finance/payouts" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "payouts Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── payouts Page Section
        ├── Identity: { Name: "payouts Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── reports Page (`/(platform)/console/finance/reports`)
    ├── Identity: { Name: "reports Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/finance/reports" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "reports Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── reports Page Section
        ├── Identity: { Name: "reports Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/finance/time/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/finance/time/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/forms/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/forms/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── fulfillment Page (`/(platform)/console/fulfillment`)
    ├── Identity: { Name: "fulfillment Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/fulfillment" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "fulfillment Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── fulfillment Page Section
        ├── Identity: { Name: "fulfillment Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── goals Page (`/(platform)/console/goals`)
    ├── Identity: { Name: "goals Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/goals" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "goals Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── goals Page Section
        ├── Identity: { Name: "goals Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── inbox Page (`/(platform)/console/inbox`)
    ├── Identity: { Name: "inbox Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/inbox" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "inbox Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── inbox Page Section
        ├── Identity: { Name: "inbox Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── inventory Page (`/(platform)/console/inventory`)
    ├── Identity: { Name: "inventory Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/inventory" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "inventory Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── inventory Page Section
        ├── Identity: { Name: "inventory Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── invoices Page (`/(platform)/console/invoices`)
    ├── Identity: { Name: "invoices Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/invoices" }
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

└── leads Page (`/(platform)/console/leads`)
    ├── Identity: { Name: "leads Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/leads" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "leads Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── leads Page Section
        ├── Identity: { Name: "leads Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── locations Page (`/(platform)/console/locations`)
    ├── Identity: { Name: "locations Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/locations" }
    ├── Capabilities: [ Navigation, Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "locations Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── locations Page Section
        ├── Identity: { Name: "locations Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── [id] Page (`/(platform)/console/locations/[id]`)
    ├── Identity: { Name: "[id] Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/locations/[id]" }
    ├── Capabilities: [ Navigation, Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "[id] Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── [id] Page Section
        ├── Identity: { Name: "[id] Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── new Page (`/(platform)/console/locations/new`)
    ├── Identity: { Name: "new Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/locations/new" }
    ├── Capabilities: [ Form Submission, Action Trigger, Database Read (Supabase), Navigation ]
    ├── Workflows: [ { Name: "new Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── new Page Section
        ├── Identity: { Name: "new Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── logistics Page (`/(platform)/console/logistics`)
    ├── Identity: { Name: "logistics Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/logistics" }
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

└── lost-found Page (`/(platform)/console/lost-found`)
    ├── Identity: { Name: "lost-found Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/lost-found" }
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

└── master-schedule Page (`/(platform)/console/master-schedule`)
    ├── Identity: { Name: "master-schedule Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/master-schedule" }
    ├── Capabilities: [ Form Submission, Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "master-schedule Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── master-schedule Page Section
        ├── Identity: { Name: "master-schedule Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── people Page (`/(platform)/console/people`)
    ├── Identity: { Name: "people Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/people" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "people Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── people Page Section
        ├── Identity: { Name: "people Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/people/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/people/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/people/credentials/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/people/credentials/(hub)" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Staff, Client, Artist ], ActionableBy: [ Vendor, Staff, Client, Artist ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/people/crew/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/people/crew/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── invites Page (`/(platform)/console/people/invites`)
    ├── Identity: { Name: "invites Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/people/invites" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "invites Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── invites Page Section
        ├── Identity: { Name: "invites Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── roles Page (`/(platform)/console/people/roles`)
    ├── Identity: { Name: "roles Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/people/roles" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "roles Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── roles Page Section
        ├── Identity: { Name: "roles Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── pipeline Page (`/(platform)/console/pipeline`)
    ├── Identity: { Name: "pipeline Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/pipeline" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "pipeline Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor ], ActionableBy: [ Vendor ] }
    └── pipeline Page Section
        ├── Identity: { Name: "pipeline Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── procurement Page (`/(platform)/console/procurement`)
    ├── Identity: { Name: "procurement Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/procurement" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "procurement Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── procurement Page Section
        ├── Identity: { Name: "procurement Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── catalog Page (`/(platform)/console/procurement/catalog`)
    ├── Identity: { Name: "catalog Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/procurement/catalog" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "catalog Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── catalog Page Section
        ├── Identity: { Name: "catalog Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/procurement/purchase-orders/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/procurement/purchase-orders/(hub)" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Client ], ActionableBy: [ Vendor, Client ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/procurement/requisitions/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/procurement/requisitions/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/procurement/rfqs/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/procurement/rfqs/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/procurement/vendors/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/procurement/vendors/(hub)" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Client ], ActionableBy: [ Vendor, Client ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/production/dispatch/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/production/dispatch/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/production/equipment/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/production/equipment/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/production/fabrication/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/production/fabrication/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/production/logistics/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/production/logistics/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/production/rentals/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/production/rentals/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/production/warehouse/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/production/warehouse/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── profitability Page (`/(platform)/console/profitability`)
    ├── Identity: { Name: "profitability Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/profitability" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "profitability Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── profitability Page Section
        ├── Identity: { Name: "profitability Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── projects Page (`/(platform)/console/projects`)
    ├── Identity: { Name: "projects Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/projects" }
    ├── Capabilities: [ Navigation, Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "projects Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── projects Page Section
        ├── Identity: { Name: "projects Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── proposals Page (`/(platform)/console/proposals`)
    ├── Identity: { Name: "proposals Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/proposals" }
    ├── Capabilities: [ Action Trigger ]
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

└── purchase-orders Page (`/(platform)/console/purchase-orders`)
    ├── Identity: { Name: "purchase-orders Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/purchase-orders" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "purchase-orders Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Client ], ActionableBy: [ Vendor, Client ] }
    └── purchase-orders Page Section
        ├── Identity: { Name: "purchase-orders Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── schedule Page (`/(platform)/console/schedule`)
    ├── Identity: { Name: "schedule Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/schedule" }
    ├── Capabilities: [ Form Submission, Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "schedule Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── schedule Page Section
        ├── Identity: { Name: "schedule Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── schedules Page (`/(platform)/console/schedules`)
    ├── Identity: { Name: "schedules Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/schedules" }
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

└── settings Page (`/(platform)/console/settings`)
    ├── Identity: { Name: "settings Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/settings" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "settings Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── settings Page Section
        ├── Identity: { Name: "settings Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── api Page (`/(platform)/console/settings/api`)
    ├── Identity: { Name: "api Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/settings/api" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "api Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── api Page Section
        ├── Identity: { Name: "api Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── billing Page (`/(platform)/console/settings/billing`)
    ├── Identity: { Name: "billing Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/settings/billing" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "billing Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── billing Page Section
        ├── Identity: { Name: "billing Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── branding Page (`/(platform)/console/settings/branding`)
    ├── Identity: { Name: "branding Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/settings/branding" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "branding Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── branding Page Section
        ├── Identity: { Name: "branding Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── domains Page (`/(platform)/console/settings/domains`)
    ├── Identity: { Name: "domains Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/settings/domains" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "domains Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── domains Page Section
        ├── Identity: { Name: "domains Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/settings/integrations/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/settings/integrations/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── organization Page (`/(platform)/console/settings/organization`)
    ├── Identity: { Name: "organization Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/settings/organization" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "organization Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── organization Page Section
        ├── Identity: { Name: "organization Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── (hub) Page (`/(platform)/console/settings/webhooks/(hub)`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/settings/webhooks/(hub)" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "(hub) Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── (hub) Page Section
        ├── Identity: { Name: "(hub) Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── shipments Page (`/(platform)/console/shipments`)
    ├── Identity: { Name: "shipments Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/shipments" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "shipments Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── shipments Page Section
        ├── Identity: { Name: "shipments Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── tasks Page (`/(platform)/console/tasks`)
    ├── Identity: { Name: "tasks Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/tasks" }
    ├── Capabilities: [ Navigation, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "tasks Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Client ], ActionableBy: [ Vendor, Client ] }
    └── tasks Page Section
        ├── Identity: { Name: "tasks Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── time Page (`/(platform)/console/time`)
    ├── Identity: { Name: "time Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/time" }
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

└── users Page (`/(platform)/console/users`)
    ├── Identity: { Name: "users Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/users" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "users Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client, Admin ], ActionableBy: [ Client, Admin ] }
    └── users Page Section
        ├── Identity: { Name: "users Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── vendors Page (`/(platform)/console/vendors`)
    ├── Identity: { Name: "vendors Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/vendors" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "vendors Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Client ], ActionableBy: [ Vendor, Client ] }
    └── vendors Page Section
        ├── Identity: { Name: "vendors Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── workloads Page (`/(platform)/console/workloads`)
    ├── Identity: { Name: "workloads Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/console/workloads" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "workloads Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── workloads Page Section
        ├── Identity: { Name: "workloads Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── notifications Page (`/(platform)/notifications`)
    ├── Identity: { Name: "notifications Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/notifications" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "notifications Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── notifications Page Section
        ├── Identity: { Name: "notifications Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── new Page (`/(platform)/projects/new`)
    ├── Identity: { Name: "new Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/projects/new" }
    ├── Capabilities: [ Action Trigger, Navigation ]
    ├── Workflows: [ { Name: "new Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Vendor, Artist, Client ], ActionableBy: [ Vendor, Artist, Client ] }
    └── new Page Section
        ├── Identity: { Name: "new Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── templates Page (`/(platform)/templates`)
    ├── Identity: { Name: "templates Page", Level: "Page", Parent: "ATLVS", Path: "/(platform)/templates" }
    ├── Capabilities: [ Action Trigger, Database Read (Supabase) ]
    ├── Workflows: [ { Name: "templates Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client ], ActionableBy: [ Client ] }
    └── templates Page Section
        ├── Identity: { Name: "templates Page Section", Level: "Section" }
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
| **Dead-End Workflows** | 57 pages lacking explicit action triggers |
| **Permission Gaps** | 57 routes relying on inherited/public ACLs |
| **Dangling Dependencies** | 0 strictly unresolved API calls |

### Dead-End Workflow Details
- `/(platform)`
- `/(platform)/console/ai`
- `/(platform)/console/ai/agents`
- `/(platform)/console/ai/assistant/[conversationId]`
- `/(platform)/console/ai/automations/(hub)`
- `/(platform)/console/ai/drafting`
- `/(platform)/console/budgets`
- `/(platform)/console/campaigns`
- `/(platform)/console/clients`
- `/(platform)/console/compliance`
- *...and 47 more.*


### Permission Gap Details
- `/(platform)`
- `/(platform)/console/ai`
- `/(platform)/console/ai/agents`
- `/(platform)/console/ai/assistant/[conversationId]`
- `/(platform)/console/ai/automations/(hub)`
- `/(platform)/console/ai/drafting`
- `/(platform)/console/audit`
- `/(platform)/console/budgets`
- `/(platform)/console/campaigns`
- `/(platform)/console/compliance`
- *...and 47 more.*

