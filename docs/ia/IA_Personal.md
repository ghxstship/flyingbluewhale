# Site Map & Workflow Inventory: Personal

```text
Personal
└── dashboard Page (`/(personal)/dashboard`)
    ├── Identity: { Name: "dashboard Page", Level: "Page", Parent: "Personal", Path: "/(personal)/dashboard" }
    ├── Capabilities: [ Form Submission, Action Trigger, Database Read (Supabase), Navigation ]
    ├── Workflows: [ { Name: "dashboard Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client, Admin ], ActionableBy: [ Client, Admin ] }
    └── dashboard Page Section
        ├── Identity: { Name: "dashboard Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── me Layout (`/(personal)/me`)
    ├── Identity: { Name: "me Layout", Level: "Layout", Parent: "Personal", Path: "/(personal)/me" }
    ├── Capabilities: [ Navigation ]
    ├── Workflows: [ { Name: "me Layout Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── me Layout Section
        ├── Identity: { Name: "me Layout Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── me Page (`/(personal)/me`)
    ├── Identity: { Name: "me Page", Level: "Page", Parent: "Personal", Path: "/(personal)/me" }
    ├── Capabilities: [ Form Submission, Action Trigger, Database Read (Supabase), Navigation ]
    ├── Workflows: [ { Name: "me Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Client, Admin ], ActionableBy: [ Client, Admin ] }
    └── me Page Section
        ├── Identity: { Name: "me Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── notifications Page (`/(personal)/me/notifications`)
    ├── Identity: { Name: "notifications Page", Level: "Page", Parent: "Personal", Path: "/(personal)/me/notifications" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "notifications Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── notifications Page Section
        ├── Identity: { Name: "notifications Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── organizations Page (`/(personal)/me/organizations`)
    ├── Identity: { Name: "organizations Page", Level: "Page", Parent: "Personal", Path: "/(personal)/me/organizations" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "organizations Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── organizations Page Section
        ├── Identity: { Name: "organizations Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── profile Page (`/(personal)/me/profile`)
    ├── Identity: { Name: "profile Page", Level: "Page", Parent: "Personal", Path: "/(personal)/me/profile" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "profile Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── profile Page Section
        ├── Identity: { Name: "profile Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── security Page (`/(personal)/me/security`)
    ├── Identity: { Name: "security Page", Level: "Page", Parent: "Personal", Path: "/(personal)/me/security" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "security Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── security Page Section
        ├── Identity: { Name: "security Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── settings Page (`/(personal)/me/settings`)
    ├── Identity: { Name: "settings Page", Level: "Page", Parent: "Personal", Path: "/(personal)/me/settings" }
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

└── tickets Page (`/(personal)/me/tickets`)
    ├── Identity: { Name: "tickets Page", Level: "Page", Parent: "Personal", Path: "/(personal)/me/tickets" }
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

```

## Quality Flags

| Flag Type | Finding |
|---|---|
| **Orphaned Elements** | 0 detected (AST limited to primary routing tree) |
| **Dead-End Workflows** | 6 pages lacking explicit action triggers |
| **Permission Gaps** | 0 routes relying on inherited/public ACLs |
| **Dangling Dependencies** | 0 strictly unresolved API calls |

### Dead-End Workflow Details
- `/(personal)/me/notifications`
- `/(personal)/me/organizations`
- `/(personal)/me/profile`
- `/(personal)/me/security`
- `/(personal)/me/settings`
- `/(personal)/me/tickets`

