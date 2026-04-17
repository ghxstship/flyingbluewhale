# Deep Site Map & Workflow Inventory: ATLVS

> *Generated via complete 5-level AST tracing*

```text
ATLVS
└── (platform) Layout (`Layout`)
    ├── Identity: { Name: "(platform) Layout", Level: "Layout", Parent: "ATLVS", Path: "//app/(platform)" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── catalog Page (`Page`)
    ├── Identity: { Name: "catalog Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/catalog" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Input (`Component`)
                ├── Identity: { Name: "Input", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── ContentGrid (`Component`)
                    ├── Identity: { Name: "ContentGrid", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── h3 (`Element`)
                            ├── Identity: { Name: "h3", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }

└── catering Page (`Page`)
    ├── Identity: { Name: "catering Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/catering" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
            └── EmptyState (`Component`)
                ├── Identity: { Name: "EmptyState", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── h3 (`Element`)
                                ├── Identity: { Name: "h3", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                    └── ProgressBar (`Component`)
                        ├── Identity: { Name: "ProgressBar", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }

└── cms Page (`Page`)
    ├── Identity: { Name: "cms Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/cms" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
            └── EmptyState (`Component`)
                ├── Identity: { Name: "EmptyState", Level: "Component" }
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }

└── console Layout (`Layout`)
    ├── Identity: { Name: "console Layout", Level: "Layout", Parent: "ATLVS", Path: "//app/(platform)/console" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Authenticated, Client ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── Sidebar (`Component`)
                ├── Identity: { Name: "Sidebar", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }

└── console Page (`Page`)
    ├── Identity: { Name: "console Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── header (`Element`)
                ├── Identity: { Name: "header", Level: "Element" }
                └── h1 (`Element`)
                    ├── Identity: { Name: "h1", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── ContentGrid (`Component`)
                        ├── Identity: { Name: "ContentGrid", Level: "Component" }
                        └── StatCard (`Component`)
                            ├── Identity: { Name: "StatCard", Level: "Component" }
                        └── StatCard (`Component`)
                            ├── Identity: { Name: "StatCard", Level: "Component" }
                        └── StatCard (`Component`)
                            ├── Identity: { Name: "StatCard", Level: "Component" }
                        └── StatCard (`Component`)
                            ├── Identity: { Name: "StatCard", Level: "Component" }
                    └── ContentGrid (`Component`)
                        ├── Identity: { Name: "ContentGrid", Level: "Component" }
                        └── QuickAction (`Component`)
                            ├── Identity: { Name: "QuickAction", Level: "Component" }
                        └── QuickAction (`Component`)
                            ├── Identity: { Name: "QuickAction", Level: "Component" }
                        └── QuickAction (`Component`)
                            ├── Identity: { Name: "QuickAction", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }

└── ai Page (`Page`)
    ├── Identity: { Name: "ai Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/ai" }
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

└── agents Page (`Page`)
    ├── Identity: { Name: "agents Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/ai/agents" }
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

└── [conversationId] Page (`Page`)
    ├── Identity: { Name: "[conversationId] Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/ai/assistant/[conversationId]" }
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

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/ai/automations/(hub)" }
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

└── drafting Page (`Page`)
    ├── Identity: { Name: "drafting Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/ai/drafting" }
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

└── assets Page (`Page`)
    ├── Identity: { Name: "assets Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/assets" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
            └── AlertBanner (`Component`)
                ├── Identity: { Name: "AlertBanner", Level: "Component" }
                └── Badge (`Component`)
                    ├── Identity: { Name: "Badge", Level: "Component" }
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }

└── audit Page (`Page`)
    ├── Identity: { Name: "audit Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/audit" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Input (`Component`)
                ├── Identity: { Name: "Input", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }

└── budgets Page (`Page`)
    ├── Identity: { Name: "budgets Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/budgets" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── campaigns Page (`Page`)
    ├── Identity: { Name: "campaigns Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/campaigns" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── clients Page (`Page`)
    ├── Identity: { Name: "clients Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/clients" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── compliance Page (`Page`)
    ├── Identity: { Name: "compliance Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/compliance" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── credentials Page (`Page`)
    ├── Identity: { Name: "credentials Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/credentials" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Staff, Vendor, Artist, Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                └── ContentGrid (`Component`)
                    ├── Identity: { Name: "ContentGrid", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── table (`Element`)
                        ├── Identity: { Name: "table", Level: "Element" }
                        └── thead (`Element`)
                            ├── Identity: { Name: "thead", Level: "Element" }
                            └── tr (`Element`)
                                ├── Identity: { Name: "tr", Level: "Element" }
                                └── th (`Element`)
                                    ├── Identity: { Name: "th", Level: "Element" }
                                └── th (`Element`)
                                    ├── Identity: { Name: "th", Level: "Element" }
                        └── tbody (`Element`)
                            ├── Identity: { Name: "tbody", Level: "Element" }
                            └── tr (`Element`)
                                ├── Identity: { Name: "tr", Level: "Element" }
                                └── td (`Element`)
                                    ├── Identity: { Name: "td", Level: "Element" }
                                └── td (`Element`)
                                    ├── Identity: { Name: "td", Level: "Element" }
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── Button (`Component`)
                            ├── Identity: { Name: "Button", Level: "Component" }
                        └── Button (`Component`)
                            ├── Identity: { Name: "Button", Level: "Component" }
                └── DataTable (`Component`)
                    ├── Identity: { Name: "DataTable", Level: "Component" }

└── crew Page (`Page`)
    ├── Identity: { Name: "crew Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/crew" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── deliverables Page (`Page`)
    ├── Identity: { Name: "deliverables Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/deliverables" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor, Artist, Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── select (`Element`)
                ├── Identity: { Name: "select", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
            └── select (`Element`)
                ├── Identity: { Name: "select", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
                └── option (`Element`)
                    ├── Identity: { Name: "option", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }

└── [id] Page (`Page`)
    ├── Identity: { Name: "[id] Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/deliverables/[id]" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── EmptyState (`Component`)
                ├── Identity: { Name: "EmptyState", Level: "Component" }
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── StatusBadge (`Component`)
                ├── Identity: { Name: "StatusBadge", Level: "Component" }
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── action (`Micro-Interaction`)
                    ├── Identity: { Name: "action", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: `/api/v1/deliverables/${id}/approve`"
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── section (`Element`)
                        ├── Identity: { Name: "section", Level: "Element" }
                        └── SectionHeading (`Component`)
                            ├── Identity: { Name: "SectionHeading", Level: "Component" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── pre (`Element`)
                                ├── Identity: { Name: "pre", Level: "Element" }
                    └── section (`Element`)
                        ├── Identity: { Name: "section", Level: "Element" }
                        └── SectionHeading (`Component`)
                            ├── Identity: { Name: "SectionHeading", Level: "Component" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                                └── p (`Element`)
                                    ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── DetailPanel (`Component`)
                        ├── Identity: { Name: "DetailPanel", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── h3 (`Element`)
                            ├── Identity: { Name: "h3", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }

└── queue Page (`Page`)
    ├── Identity: { Name: "queue Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/deliverables/queue" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── EmptyState (`Component`)
                ├── Identity: { Name: "EmptyState", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Link (`Component`)
                    ├── Identity: { Name: "Link", Level: "Component" }
                    └── input (`Element`)
                        ├── Identity: { Name: "input", Level: "Element" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: (e) => e.stopPropagation()"
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── StatusBadge (`Component`)
                                ├── Identity: { Name: "StatusBadge", Level: "Component" }
                            └── Badge (`Component`)
                                ├── Identity: { Name: "Badge", Level: "Component" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }

└── equipment Page (`Page`)
    ├── Identity: { Name: "equipment Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/equipment" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── expenses Page (`Page`)
    ├── Identity: { Name: "expenses Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/expenses" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ExpensesTable (`Component`)
                ├── Identity: { Name: "ExpensesTable", Level: "Component" }

└── fabrication Page (`Page`)
    ├── Identity: { Name: "fabrication Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/fabrication" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── files Page (`Page`)
    ├── Identity: { Name: "files Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/files" }
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

└── finance Page (`Page`)
    ├── Identity: { Name: "finance Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/finance" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/finance/advances/(hub)" }
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

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/finance/budgets/(hub)" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/finance/expenses/(hub)" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ExpensesTable (`Component`)
                ├── Identity: { Name: "ExpensesTable", Level: "Component" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/finance/invoices/(hub)" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── InvoiceTabs (`Component`)
                ├── Identity: { Name: "InvoiceTabs", Level: "Component" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/finance/mileage/(hub)" }
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

└── payouts Page (`Page`)
    ├── Identity: { Name: "payouts Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/finance/payouts" }
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

└── reports Page (`Page`)
    ├── Identity: { Name: "reports Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/finance/reports" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/finance/time/(hub)" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/forms/(hub)" }
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

└── fulfillment Page (`Page`)
    ├── Identity: { Name: "fulfillment Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/fulfillment" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── KanbanBoard (`Component`)
                ├── Identity: { Name: "KanbanBoard", Level: "Component" }

└── goals Page (`Page`)
    ├── Identity: { Name: "goals Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/goals" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── inbox Page (`Page`)
    ├── Identity: { Name: "inbox Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/inbox" }
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

└── inventory Page (`Page`)
    ├── Identity: { Name: "inventory Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/inventory" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
    └── span Section (`Section`)
        ├── Identity: { Name: "span Section", Level: "Section" }
        └── span (`Element`)
            ├── Identity: { Name: "span", Level: "Element" }
    └── span Section (`Section`)
        ├── Identity: { Name: "span Section", Level: "Section" }
        └── span (`Element`)
            ├── Identity: { Name: "span", Level: "Element" }
    └── span Section (`Section`)
        ├── Identity: { Name: "span Section", Level: "Section" }
        └── span (`Element`)
            ├── Identity: { Name: "span", Level: "Element" }
    └── span Section (`Section`)
        ├── Identity: { Name: "span Section", Level: "Section" }
        └── span (`Element`)
            ├── Identity: { Name: "span", Level: "Element" }
    └── span Section (`Section`)
        ├── Identity: { Name: "span Section", Level: "Section" }
        └── span (`Element`)
            ├── Identity: { Name: "span", Level: "Element" }
    └── ProgressBar Section (`Section`)
        ├── Identity: { Name: "ProgressBar Section", Level: "Section" }
        └── ProgressBar (`Component`)
            ├── Identity: { Name: "ProgressBar", Level: "Component" }
    └── span Section (`Section`)
        ├── Identity: { Name: "span Section", Level: "Section" }
        └── span (`Element`)
            ├── Identity: { Name: "span", Level: "Element" }
    └── span Section (`Section`)
        ├── Identity: { Name: "span Section", Level: "Section" }
        └── span (`Element`)
            ├── Identity: { Name: "span", Level: "Element" }
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
            └── AlertBanner (`Component`)
                ├── Identity: { Name: "AlertBanner", Level: "Component" }
                └── Badge (`Component`)
                    ├── Identity: { Name: "Badge", Level: "Component" }
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }

└── invoices Page (`Page`)
    ├── Identity: { Name: "invoices Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/invoices" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── InvoiceTabs (`Component`)
                ├── Identity: { Name: "InvoiceTabs", Level: "Component" }

└── leads Page (`Page`)
    ├── Identity: { Name: "leads Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/leads" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── locations Page (`Page`)
    ├── Identity: { Name: "locations Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/locations" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
            └── EmptyState (`Component`)
                ├── Identity: { Name: "EmptyState", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Link (`Component`)
                        ├── Identity: { Name: "Link", Level: "Component" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── h3 (`Element`)
                                        ├── Identity: { Name: "h3", Level: "Element" }
                                    └── p (`Element`)
                                        ├── Identity: { Name: "p", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                        └── span (`Element`)
                                            ├── Identity: { Name: "span", Level: "Element" }
                                            └── span (`Element`)
                                                ├── Identity: { Name: "span", Level: "Element" }
                                        └── span (`Element`)
                                            ├── Identity: { Name: "span", Level: "Element" }
                                        └── span (`Element`)
                                            ├── Identity: { Name: "span", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── Link (`Component`)
                            ├── Identity: { Name: "Link", Level: "Component" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }

└── [id] Page (`Page`)
    ├── Identity: { Name: "[id] Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/locations/[id]" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
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
                        └── Link (`Component`)
                            ├── Identity: { Name: "Link", Level: "Component" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── Link (`Component`)
                            ├── Identity: { Name: "Link", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── h1 (`Element`)
                                    ├── Identity: { Name: "h1", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── button (`Element`)
                                ├── Identity: { Name: "button", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── Link (`Component`)
                                    ├── Identity: { Name: "Link", Level: "Component" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                            └── table (`Element`)
                                ├── Identity: { Name: "table", Level: "Element" }
                                └── thead (`Element`)
                                    ├── Identity: { Name: "thead", Level: "Element" }
                                    └── tr (`Element`)
                                        ├── Identity: { Name: "tr", Level: "Element" }
                                        └── th (`Element`)
                                            ├── Identity: { Name: "th", Level: "Element" }
                                └── tbody (`Element`)
                                    ├── Identity: { Name: "tbody", Level: "Element" }
                                    └── tr (`Element`)
                                        ├── Identity: { Name: "tr", Level: "Element" }
                                        └── td (`Element`)
                                            ├── Identity: { Name: "td", Level: "Element" }
                                        └── td (`Element`)
                                            ├── Identity: { Name: "td", Level: "Element" }
                                        └── td (`Element`)
                                            ├── Identity: { Name: "td", Level: "Element" }
                                        └── td (`Element`)
                                            ├── Identity: { Name: "td", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }

└── new Page (`Page`)
    ├── Identity: { Name: "new Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/locations/new" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── header (`Element`)
                ├── Identity: { Name: "header", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Link (`Component`)
                        ├── Identity: { Name: "Link", Level: "Component" }
                    └── h1 (`Element`)
                        ├── Identity: { Name: "h1", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── form (`Element`)
                        ├── Identity: { Name: "form", Level: "Element" }
                        └── action (`Micro-Interaction`)
                            ├── Identity: { Name: "action", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: Dynamic Handler"
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── label (`Element`)
                                        ├── Identity: { Name: "label", Level: "Element" }
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── label (`Element`)
                                        ├── Identity: { Name: "label", Level: "Element" }
                                    └── select (`Element`)
                                        ├── Identity: { Name: "select", Level: "Element" }
                                        └── option (`Element`)
                                            ├── Identity: { Name: "option", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── label (`Element`)
                                        ├── Identity: { Name: "label", Level: "Element" }
                                    └── select (`Element`)
                                        ├── Identity: { Name: "select", Level: "Element" }
                                        └── option (`Element`)
                                            ├── Identity: { Name: "option", Level: "Element" }
                                        └── option (`Element`)
                                            ├── Identity: { Name: "option", Level: "Element" }
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── label (`Element`)
                                        ├── Identity: { Name: "label", Level: "Element" }
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                        └── label (`Element`)
                                            ├── Identity: { Name: "label", Level: "Element" }
                                        └── input (`Element`)
                                            ├── Identity: { Name: "input", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                        └── label (`Element`)
                                            ├── Identity: { Name: "label", Level: "Element" }
                                        └── input (`Element`)
                                            ├── Identity: { Name: "input", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                        └── label (`Element`)
                                            ├── Identity: { Name: "label", Level: "Element" }
                                        └── input (`Element`)
                                            ├── Identity: { Name: "input", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── label (`Element`)
                                        ├── Identity: { Name: "label", Level: "Element" }
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── label (`Element`)
                                        ├── Identity: { Name: "label", Level: "Element" }
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── label (`Element`)
                                        ├── Identity: { Name: "label", Level: "Element" }
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── label (`Element`)
                                        ├── Identity: { Name: "label", Level: "Element" }
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── label (`Element`)
                                        ├── Identity: { Name: "label", Level: "Element" }
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── label (`Element`)
                                        ├── Identity: { Name: "label", Level: "Element" }
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
                        └── section (`Element`)
                            ├── Identity: { Name: "section", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── label (`Element`)
                                    ├── Identity: { Name: "label", Level: "Element" }
                                └── select (`Element`)
                                    ├── Identity: { Name: "select", Level: "Element" }
                                    └── option (`Element`)
                                        ├── Identity: { Name: "option", Level: "Element" }
                                    └── option (`Element`)
                                        ├── Identity: { Name: "option", Level: "Element" }
                                └── p (`Element`)
                                    ├── Identity: { Name: "p", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── Link (`Component`)
                                ├── Identity: { Name: "Link", Level: "Component" }
                            └── button (`Element`)
                                ├── Identity: { Name: "button", Level: "Element" }

└── logistics Page (`Page`)
    ├── Identity: { Name: "logistics Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/logistics" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── lost-found Page (`Page`)
    ├── Identity: { Name: "lost-found Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/lost-found" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
            └── EmptyState (`Component`)
                ├── Identity: { Name: "EmptyState", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── StatusBadge (`Component`)
                                ├── Identity: { Name: "StatusBadge", Level: "Component" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }

└── master-schedule Page (`Page`)
    ├── Identity: { Name: "master-schedule Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/master-schedule" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── action (`Micro-Interaction`)
                    ├── Identity: { Name: "action", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: Dynamic Handler"
                └── button (`Element`)
                    ├── Identity: { Name: "button", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ScheduleTimeline (`Component`)
                ├── Identity: { Name: "ScheduleTimeline", Level: "Component" }

└── people Page (`Page`)
    ├── Identity: { Name: "people Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/people" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── PeopleGrid (`Component`)
                ├── Identity: { Name: "PeopleGrid", Level: "Component" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/people/(hub)" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── PeopleGrid (`Component`)
                ├── Identity: { Name: "PeopleGrid", Level: "Component" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/people/credentials/(hub)" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Staff, Vendor, Artist, Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                └── ContentGrid (`Component`)
                    ├── Identity: { Name: "ContentGrid", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── table (`Element`)
                        ├── Identity: { Name: "table", Level: "Element" }
                        └── thead (`Element`)
                            ├── Identity: { Name: "thead", Level: "Element" }
                            └── tr (`Element`)
                                ├── Identity: { Name: "tr", Level: "Element" }
                                └── th (`Element`)
                                    ├── Identity: { Name: "th", Level: "Element" }
                                └── th (`Element`)
                                    ├── Identity: { Name: "th", Level: "Element" }
                        └── tbody (`Element`)
                            ├── Identity: { Name: "tbody", Level: "Element" }
                            └── tr (`Element`)
                                ├── Identity: { Name: "tr", Level: "Element" }
                                └── td (`Element`)
                                    ├── Identity: { Name: "td", Level: "Element" }
                                └── td (`Element`)
                                    ├── Identity: { Name: "td", Level: "Element" }
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── Button (`Component`)
                            ├── Identity: { Name: "Button", Level: "Component" }
                        └── Button (`Component`)
                            ├── Identity: { Name: "Button", Level: "Component" }
                └── DataTable (`Component`)
                    ├── Identity: { Name: "DataTable", Level: "Component" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/people/crew/(hub)" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── invites Page (`Page`)
    ├── Identity: { Name: "invites Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/people/invites" }
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

└── roles Page (`Page`)
    ├── Identity: { Name: "roles Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/people/roles" }
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

└── pipeline Page (`Page`)
    ├── Identity: { Name: "pipeline Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/pipeline" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── PipelineViewSwitcher (`Component`)
                ├── Identity: { Name: "PipelineViewSwitcher", Level: "Component" }

└── procurement Page (`Page`)
    ├── Identity: { Name: "procurement Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/procurement" }
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

└── catalog Page (`Page`)
    ├── Identity: { Name: "catalog Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/procurement/catalog" }
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

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/procurement/purchase-orders/(hub)" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor, Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/procurement/requisitions/(hub)" }
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

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/procurement/rfqs/(hub)" }
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

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/procurement/vendors/(hub)" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor, Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/production/dispatch/(hub)" }
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

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/production/equipment/(hub)" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/production/fabrication/(hub)" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/production/logistics/(hub)" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/production/rentals/(hub)" }
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

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/production/warehouse/(hub)" }
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

└── profitability Page (`Page`)
    ├── Identity: { Name: "profitability Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/profitability" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── projects Page (`Page`)
    ├── Identity: { Name: "projects Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/projects" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── EmptyState (`Component`)
                ├── Identity: { Name: "EmptyState", Level: "Component" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── Link (`Component`)
                    ├── Identity: { Name: "Link", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── StatusBadge (`Component`)
                            ├── Identity: { Name: "StatusBadge", Level: "Component" }
                        └── Badge (`Component`)
                            ├── Identity: { Name: "Badge", Level: "Component" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }

└── proposals Page (`Page`)
    ├── Identity: { Name: "proposals Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/proposals" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── Card (`Component`)
                ├── Identity: { Name: "Card", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── svg (`Element`)
                        ├── Identity: { Name: "svg", Level: "Element" }
                        └── path (`Element`)
                            ├── Identity: { Name: "path", Level: "Element" }
                └── h3 (`Element`)
                    ├── Identity: { Name: "h3", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }

└── purchase-orders Page (`Page`)
    ├── Identity: { Name: "purchase-orders Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/purchase-orders" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor, Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }

└── schedule Page (`Page`)
    ├── Identity: { Name: "schedule Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/schedule" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── action (`Micro-Interaction`)
                    ├── Identity: { Name: "action", Level: "Micro-Interaction" }
                    └── Behavior: "Invokes: Dynamic Handler"
                └── button (`Element`)
                    ├── Identity: { Name: "button", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ScheduleTimeline (`Component`)
                ├── Identity: { Name: "ScheduleTimeline", Level: "Component" }

└── schedules Page (`Page`)
    ├── Identity: { Name: "schedules Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/schedules" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── AlertBanner (`Component`)
                ├── Identity: { Name: "AlertBanner", Level: "Component" }
                └── Badge (`Component`)
                    ├── Identity: { Name: "Badge", Level: "Component" }
            └── ScheduleTimeline (`Component`)
                ├── Identity: { Name: "ScheduleTimeline", Level: "Component" }

└── settings Page (`Page`)
    ├── Identity: { Name: "settings Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/settings" }
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

└── api Page (`Page`)
    ├── Identity: { Name: "api Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/settings/api" }
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

└── billing Page (`Page`)
    ├── Identity: { Name: "billing Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/settings/billing" }
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

└── branding Page (`Page`)
    ├── Identity: { Name: "branding Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/settings/branding" }
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

└── domains Page (`Page`)
    ├── Identity: { Name: "domains Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/settings/domains" }
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

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/settings/integrations/(hub)" }
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

└── organization Page (`Page`)
    ├── Identity: { Name: "organization Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/settings/organization" }
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

└── (hub) Page (`Page`)
    ├── Identity: { Name: "(hub) Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/settings/webhooks/(hub)" }
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

└── shipments Page (`Page`)
    ├── Identity: { Name: "shipments Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/shipments" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── AlertBanner (`Component`)
                ├── Identity: { Name: "AlertBanner", Level: "Component" }
                └── Badge (`Component`)
                    ├── Identity: { Name: "Badge", Level: "Component" }
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }

└── tasks Page (`Page`)
    ├── Identity: { Name: "tasks Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/tasks" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Authenticated, Vendor, Client ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── header (`Element`)
                ├── Identity: { Name: "header", Level: "Element" }
                └── h1 (`Element`)
                    ├── Identity: { Name: "h1", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── h2 (`Element`)
                        ├── Identity: { Name: "h2", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── ul (`Element`)
                        ├── Identity: { Name: "ul", Level: "Element" }
                        └── li (`Element`)
                            ├── Identity: { Name: "li", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── p (`Element`)
                                        ├── Identity: { Name: "p", Level: "Element" }
                                    └── p (`Element`)
                                        ├── Identity: { Name: "p", Level: "Element" }
                                └── Link (`Component`)
                                    ├── Identity: { Name: "Link", Level: "Component" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── h2 (`Element`)
                        ├── Identity: { Name: "h2", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── ul (`Element`)
                        ├── Identity: { Name: "ul", Level: "Element" }
                        └── li (`Element`)
                            ├── Identity: { Name: "li", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── p (`Element`)
                                        ├── Identity: { Name: "p", Level: "Element" }
                                    └── p (`Element`)
                                        ├── Identity: { Name: "p", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }

└── time Page (`Page`)
    ├── Identity: { Name: "time Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/time" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── users Page (`Page`)
    ├── Identity: { Name: "users Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/users" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Admin, Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── Badge (`Component`)
                                ├── Identity: { Name: "Badge", Level: "Component" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── Badge (`Component`)
                                ├── Identity: { Name: "Badge", Level: "Component" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── DataTable (`Component`)
                    ├── Identity: { Name: "DataTable", Level: "Component" }

└── vendors Page (`Page`)
    ├── Identity: { Name: "vendors Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/vendors" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor, Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }

└── workloads Page (`Page`)
    ├── Identity: { Name: "workloads Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/console/workloads" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }

└── error Component (`Component`)
    ├── Identity: { Name: "error Component", Level: "Component", Parent: "ATLVS", Path: "//app/(platform)/error" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                └── h2 (`Element`)
                    ├── Identity: { Name: "h2", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── button (`Element`)
                    ├── Identity: { Name: "button", Level: "Element" }
                    └── onClick (`Micro-Interaction`)
                        ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                        └── Behavior: "Invokes: () => reset()"

└── loading Component (`Component`)
    ├── Identity: { Name: "loading Component", Level: "Component", Parent: "ATLVS", Path: "//app/(platform)/loading" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }

└── notifications Page (`Page`)
    ├── Identity: { Name: "notifications Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/notifications" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                └── ContentGrid (`Component`)
                    ├── Identity: { Name: "ContentGrid", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── Badge (`Component`)
                                ├── Identity: { Name: "Badge", Level: "Component" }
                            └── Badge (`Component`)
                                ├── Identity: { Name: "Badge", Level: "Component" }
                        └── h3 (`Element`)
                            ├── Identity: { Name: "h3", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── EmptyState (`Component`)
                    ├── Identity: { Name: "EmptyState", Level: "Component" }
                └── DataTable (`Component`)
                    ├── Identity: { Name: "DataTable", Level: "Component" }

└── new Page (`Page`)
    ├── Identity: { Name: "new Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/projects/new" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor, Artist, Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── ContentGrid (`Component`)
                    ├── Identity: { Name: "ContentGrid", Level: "Component" }
                    └── button (`Element`)
                        ├── Identity: { Name: "button", Level: "Element" }
                        └── h3 (`Element`)
                            ├── Identity: { Name: "h3", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── ul (`Element`)
                            ├── Identity: { Name: "ul", Level: "Element" }
                            └── li (`Element`)
                                ├── Identity: { Name: "li", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── label (`Element`)
                                ├── Identity: { Name: "label", Level: "Element" }
                            └── Input (`Component`)
                                ├── Identity: { Name: "Input", Level: "Component" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── label (`Element`)
                                ├── Identity: { Name: "label", Level: "Element" }
                            └── Input (`Component`)
                                ├── Identity: { Name: "Input", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── label (`Element`)
                                ├── Identity: { Name: "label", Level: "Element" }
                            └── Input (`Component`)
                                ├── Identity: { Name: "Input", Level: "Component" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── label (`Element`)
                                ├── Identity: { Name: "label", Level: "Element" }
                            └── Input (`Component`)
                                ├── Identity: { Name: "Input", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── label (`Element`)
                            ├── Identity: { Name: "label", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── select (`Element`)
                                ├── Identity: { Name: "select", Level: "Element" }
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                                └── Link (`Component`)
                                    ├── Identity: { Name: "Link", Level: "Component" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── label (`Element`)
                            ├── Identity: { Name: "label", Level: "Element" }
                        └── Input (`Component`)
                            ├── Identity: { Name: "Input", Level: "Component" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── ContentGrid (`Component`)
                    ├── Identity: { Name: "ContentGrid", Level: "Component" }
                    └── label (`Element`)
                        ├── Identity: { Name: "label", Level: "Element" }
                        └── input (`Element`)
                            ├── Identity: { Name: "input", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }

└── templates Page (`Page`)
    ├── Identity: { Name: "templates Page", Level: "Page", Parent: "ATLVS", Path: "//app/(platform)/templates" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── Button (`Component`)
                ├── Identity: { Name: "Button", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── ContentGrid (`Component`)
                    ├── Identity: { Name: "ContentGrid", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── h3 (`Element`)
                            ├── Identity: { Name: "h3", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                        └── Button (`Component`)
                            ├── Identity: { Name: "Button", Level: "Component" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── DataTable (`Component`)
                    ├── Identity: { Name: "DataTable", Level: "Component" }

```

## Quality Flags

| Flag Type | Finding |
|---|---|
| **Orphaned Elements** | 0 detected |
| **Dead-End Workflows** | 0 mapped pages without explicit action triggers/forms |
| **Permission Gaps** | 3 routes relying on inherited/public ACLs |
| **Dangling Dependencies** | 0 strictly unresolved API calls |

### Permission Gap Details
- `//app/(platform)`
- `//app/(platform)/error`
- `//app/(platform)/loading`

