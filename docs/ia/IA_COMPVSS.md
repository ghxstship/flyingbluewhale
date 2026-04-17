# Site Map & Workflow Inventory: COMPVSS

```text
COMPVSS
└── m Layout (`/(mobile)/m`)
    ├── Identity: { Name: "m Layout", Level: "Layout", Parent: "COMPVSS", Path: "/(mobile)/m" }
    ├── Capabilities: [ Navigation ]
    ├── Workflows: [ { Name: "m Layout Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── m Layout Section
        ├── Identity: { Name: "m Layout Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── m Page (`/(mobile)/m`)
    ├── Identity: { Name: "m Page", Level: "Page", Parent: "COMPVSS", Path: "/(mobile)/m" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "m Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── m Page Section
        ├── Identity: { Name: "m Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── check-in Page (`/(mobile)/m/check-in`)
    ├── Identity: { Name: "check-in Page", Level: "Page", Parent: "COMPVSS", Path: "/(mobile)/m/check-in" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "check-in Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── check-in Page Section
        ├── Identity: { Name: "check-in Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── manual Page (`/(mobile)/m/check-in/manual`)
    ├── Identity: { Name: "manual Page", Level: "Page", Parent: "COMPVSS", Path: "/(mobile)/m/check-in/manual" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "manual Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── manual Page Section
        ├── Identity: { Name: "manual Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── [slug] Page (`/(mobile)/m/check-in/scan/[slug]`)
    ├── Identity: { Name: "[slug] Page", Level: "Page", Parent: "COMPVSS", Path: "/(mobile)/m/check-in/scan/[slug]" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "[slug] Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── [slug] Page Section
        ├── Identity: { Name: "[slug] Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── crew Page (`/(mobile)/m/crew`)
    ├── Identity: { Name: "crew Page", Level: "Page", Parent: "COMPVSS", Path: "/(mobile)/m/crew" }
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

└── clock Page (`/(mobile)/m/crew/clock`)
    ├── Identity: { Name: "clock Page", Level: "Page", Parent: "COMPVSS", Path: "/(mobile)/m/crew/clock" }
    ├── Capabilities: [ Action Trigger ]
    ├── Workflows: [ { Name: "clock Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── clock Page Section
        ├── Identity: { Name: "clock Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── new Page (`/(mobile)/m/incidents/new`)
    ├── Identity: { Name: "new Page", Level: "Page", Parent: "COMPVSS", Path: "/(mobile)/m/incidents/new" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "new Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── new Page Section
        ├── Identity: { Name: "new Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── scan Page (`/(mobile)/m/inventory/scan`)
    ├── Identity: { Name: "scan Page", Level: "Page", Parent: "COMPVSS", Path: "/(mobile)/m/inventory/scan" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "scan Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── scan Page Section
        ├── Identity: { Name: "scan Page Section", Level: "Section" }
        └── Core Component
            ├── Identity: { Name: "Core Component", Level: "Component" }
            └── UI Element
                ├── Identity: { Name: "UI Element", Level: "Element" }
                └── Interaction Trigger
                    ├── Identity: { Name: "Interaction Trigger", Level: "Micro-Interaction" }
                    └── Behavior: "[Auto-mapped UI state reaction]"

└── settings Page (`/(mobile)/m/settings`)
    ├── Identity: { Name: "settings Page", Level: "Page", Parent: "COMPVSS", Path: "/(mobile)/m/settings" }
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

└── tasks Page (`/(mobile)/m/tasks`)
    ├── Identity: { Name: "tasks Page", Level: "Page", Parent: "COMPVSS", Path: "/(mobile)/m/tasks" }
    ├── Capabilities: [ Static Render ]
    ├── Workflows: [ { Name: "tasks Page Flow", Role: "Step", Sequence: "Auto-Mapped", Type: "Branching" } ]
    ├── Relationships: { Upstream: [], Downstream: [] }
    ├── RBAC: { VisibleTo: [ Public / Inherited ], ActionableBy: [ Public / Inherited ] }
    └── tasks Page Section
        ├── Identity: { Name: "tasks Page Section", Level: "Section" }
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
| **Dead-End Workflows** | 9 pages lacking explicit action triggers |
| **Permission Gaps** | 11 routes relying on inherited/public ACLs |
| **Dangling Dependencies** | 0 strictly unresolved API calls |

### Dead-End Workflow Details
- `/(mobile)/m`
- `/(mobile)/m/check-in`
- `/(mobile)/m/check-in/manual`
- `/(mobile)/m/check-in/scan/[slug]`
- `/(mobile)/m/crew`
- `/(mobile)/m/incidents/new`
- `/(mobile)/m/inventory/scan`
- `/(mobile)/m/settings`
- `/(mobile)/m/tasks`


### Permission Gap Details
- `/(mobile)/m`
- `/(mobile)/m`
- `/(mobile)/m/check-in`
- `/(mobile)/m/check-in/manual`
- `/(mobile)/m/check-in/scan/[slug]`
- `/(mobile)/m/crew`
- `/(mobile)/m/crew/clock`
- `/(mobile)/m/incidents/new`
- `/(mobile)/m/inventory/scan`
- `/(mobile)/m/settings`
- *...and 1 more.*

