# Deep Site Map & Workflow Inventory: COMPVSS

> *Generated via complete 5-level AST tracing*

```text
COMPVSS
└── m Layout (`Layout`)
    ├── Identity: { Name: "m Layout", Level: "Layout", Parent: "COMPVSS", Path: "//app/(mobile)/m" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── header (`Element`)
                ├── Identity: { Name: "header", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
            └── main (`Element`)
                ├── Identity: { Name: "main", Level: "Element" }
            └── nav (`Element`)
                ├── Identity: { Name: "nav", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Link (`Component`)
                        ├── Identity: { Name: "Link", Level: "Component" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }

└── m Page (`Page`)
    ├── Identity: { Name: "m Page", Level: "Page", Parent: "COMPVSS", Path: "//app/(mobile)/m" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h1 (`Element`)
                ├── Identity: { Name: "h1", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }

└── check-in Page (`Page`)
    ├── Identity: { Name: "check-in Page", Level: "Page", Parent: "COMPVSS", Path: "//app/(mobile)/m/check-in" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h1 (`Element`)
                ├── Identity: { Name: "h1", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }

└── manual Page (`Page`)
    ├── Identity: { Name: "manual Page", Level: "Page", Parent: "COMPVSS", Path: "//app/(mobile)/m/check-in/manual" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h1 (`Element`)
                ├── Identity: { Name: "h1", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }

└── [slug] Page (`Page`)
    ├── Identity: { Name: "[slug] Page", Level: "Page", Parent: "COMPVSS", Path: "//app/(mobile)/m/check-in/scan/[slug]" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── span (`Element`)
                    ├── Identity: { Name: "span", Level: "Element" }
            └── h1 (`Element`)
                ├── Identity: { Name: "h1", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }

└── crew Page (`Page`)
    ├── Identity: { Name: "crew Page", Level: "Page", Parent: "COMPVSS", Path: "//app/(mobile)/m/crew" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h1 (`Element`)
                ├── Identity: { Name: "h1", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }

└── clock Page (`Page`)
    ├── Identity: { Name: "clock Page", Level: "Page", Parent: "COMPVSS", Path: "//app/(mobile)/m/crew/clock" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
            └── h1 (`Element`)
                ├── Identity: { Name: "h1", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }
            └── button (`Element`)
                ├── Identity: { Name: "button", Level: "Element" }

└── new Page (`Page`)
    ├── Identity: { Name: "new Page", Level: "Page", Parent: "COMPVSS", Path: "//app/(mobile)/m/incidents/new" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h1 (`Element`)
                ├── Identity: { Name: "h1", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }

└── scan Page (`Page`)
    ├── Identity: { Name: "scan Page", Level: "Page", Parent: "COMPVSS", Path: "//app/(mobile)/m/inventory/scan" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h1 (`Element`)
                ├── Identity: { Name: "h1", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }

└── settings Page (`Page`)
    ├── Identity: { Name: "settings Page", Level: "Page", Parent: "COMPVSS", Path: "//app/(mobile)/m/settings" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h1 (`Element`)
                ├── Identity: { Name: "h1", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }

└── tasks Page (`Page`)
    ├── Identity: { Name: "tasks Page", Level: "Page", Parent: "COMPVSS", Path: "//app/(mobile)/m/tasks" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h1 (`Element`)
                ├── Identity: { Name: "h1", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }

```

## Quality Flags

| Flag Type | Finding |
|---|---|
| **Orphaned Elements** | 0 detected |
| **Dead-End Workflows** | 0 mapped pages without explicit action triggers/forms |
| **Permission Gaps** | 2 routes relying on inherited/public ACLs |
| **Dangling Dependencies** | 0 strictly unresolved API calls |

### Permission Gap Details
- `//app/(mobile)/m`
- `//app/(mobile)/m`

