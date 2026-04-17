# Deep Site Map & Workflow Inventory: GVTEWAY

> *Generated via complete 5-level AST tracing*

```text
GVTEWAY
└── error Component (`Component`)
    ├── Identity: { Name: "error Component", Level: "Component", Parent: "GVTEWAY", Path: "//app/(portal)/error" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
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
    ├── Identity: { Name: "loading Component", Level: "Component", Parent: "GVTEWAY", Path: "//app/(portal)/loading" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }

└── [slug] Layout (`Layout`)
    ├── Identity: { Name: "[slug] Layout", Level: "Layout", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Authenticated, Client ] }
    └── Internal Components:
    └── GlobalProfileProvider Section (`Section`)
        ├── Identity: { Name: "GlobalProfileProvider Section", Level: "Section" }
        └── GlobalProfileProvider (`Component`)
            ├── Identity: { Name: "GlobalProfileProvider", Level: "Component" }
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
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── ThemeToggle (`Component`)
                            ├── Identity: { Name: "ThemeToggle", Level: "Component" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                        └── form (`Element`)
                            ├── Identity: { Name: "form", Level: "Element" }
                            └── action (`Micro-Interaction`)
                                ├── Identity: { Name: "action", Level: "Micro-Interaction" }
                                └── Behavior: "Invokes: Dynamic Handler"
                            └── button (`Element`)
                                ├── Identity: { Name: "button", Level: "Element" }
                └── main (`Element`)
                    ├── Identity: { Name: "main", Level: "Element" }

└── artist Page (`Page`)
    ├── Identity: { Name: "artist Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Artist, Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                └── h1 (`Element`)
                    ├── Identity: { Name: "h1", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── Link (`Component`)
                    ├── Identity: { Name: "Link", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── h3 (`Element`)
                            ├── Identity: { Name: "h3", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }

└── advancing Page (`Page`)
    ├── Identity: { Name: "advancing Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist/advancing" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Artist, Client, Authenticated ] }
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
                └── Link (`Component`)
                    ├── Identity: { Name: "Link", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── h3 (`Element`)
                                ├── Identity: { Name: "h3", Level: "Element" }
                            └── StatusBadge (`Component`)
                                ├── Identity: { Name: "StatusBadge", Level: "Component" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }

└── crew-list Page (`Page`)
    ├── Identity: { Name: "crew-list Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist/advancing/crew-list" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Artist, Authenticated ] }
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
                    └── Badge (`Component`)
                        ├── Identity: { Name: "Badge", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
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
                            └── select (`Element`)
                                ├── Identity: { Name: "select", Level: "Element" }
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
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
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }

└── guest-list Page (`Page`)
    ├── Identity: { Name: "guest-list Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist/advancing/guest-list" }
    ├── Capabilities: [ Static Module ]
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
                        └── strong (`Element`)
                            ├── Identity: { Name: "strong", Level: "Element" }
                        └── strong (`Element`)
                            ├── Identity: { Name: "strong", Level: "Element" }
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
                        └── button (`Element`)
                            ├── Identity: { Name: "button", Level: "Element" }
                    └── section (`Element`)
                        ├── Identity: { Name: "section", Level: "Element" }
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
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                    └── section (`Element`)
                        ├── Identity: { Name: "section", Level: "Element" }
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
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                                └── input (`Element`)
                                    ├── Identity: { Name: "input", Level: "Element" }
                                └── input (`Element`)
                                    ├── Identity: { Name: "input", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }

└── hospitality-rider Page (`Page`)
    ├── Identity: { Name: "hospitality-rider Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist/advancing/hospitality-rider" }
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
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Badge (`Component`)
                        ├── Identity: { Name: "Badge", Level: "Component" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
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
                                └── label (`Element`)
                                    ├── Identity: { Name: "label", Level: "Element" }
                                └── label (`Element`)
                                    ├── Identity: { Name: "label", Level: "Element" }
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                └── Input (`Component`)
                                    ├── Identity: { Name: "Input", Level: "Component" }
                                └── Input (`Component`)
                                    ├── Identity: { Name: "Input", Level: "Component" }
                                └── textarea (`Element`)
                                    ├── Identity: { Name: "textarea", Level: "Element" }

└── input-list Page (`Page`)
    ├── Identity: { Name: "input-list Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist/advancing/input-list" }
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
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Badge (`Component`)
                        ├── Identity: { Name: "Badge", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }

└── stage-plot Page (`Page`)
    ├── Identity: { Name: "stage-plot Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist/advancing/stage-plot" }
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
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Badge (`Component`)
                        ├── Identity: { Name: "Badge", Level: "Component" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
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
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── label (`Element`)
                        ├── Identity: { Name: "label", Level: "Element" }
                        └── input (`Element`)
                            ├── Identity: { Name: "input", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── textarea (`Element`)
                        ├── Identity: { Name: "textarea", Level: "Element" }

└── technical-rider Page (`Page`)
    ├── Identity: { Name: "technical-rider Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist/advancing/technical-rider" }
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
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Badge (`Component`)
                        ├── Identity: { Name: "Badge", Level: "Component" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── Button (`Component`)
                    ├── Identity: { Name: "Button", Level: "Component" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── SectionHeading (`Component`)
                            ├── Identity: { Name: "SectionHeading", Level: "Component" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
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
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── Input (`Component`)
                                ├── Identity: { Name: "Input", Level: "Component" }
                            └── select (`Element`)
                                ├── Identity: { Name: "select", Level: "Element" }
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
                                └── option (`Element`)
                                    ├── Identity: { Name: "option", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── textarea (`Element`)
                    ├── Identity: { Name: "textarea", Level: "Element" }

└── catering Page (`Page`)
    ├── Identity: { Name: "catering Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist/catering" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Artist, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── form (`Element`)
                ├── Identity: { Name: "form", Level: "Element" }
                └── section (`Element`)
                    ├── Identity: { Name: "section", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── label (`Element`)
                            ├── Identity: { Name: "label", Level: "Element" }
                            └── input (`Element`)
                                ├── Identity: { Name: "input", Level: "Element" }
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                └── section (`Element`)
                    ├── Identity: { Name: "section", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── textarea (`Element`)
                        ├── Identity: { Name: "textarea", Level: "Element" }
                └── section (`Element`)
                    ├── Identity: { Name: "section", Level: "Element" }
                    └── h2 (`Element`)
                        ├── Identity: { Name: "h2", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── Input (`Component`)
                        ├── Identity: { Name: "Input", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }

└── credentials Page (`Page`)
    ├── Identity: { Name: "credentials Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist/credentials" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Artist, Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── form (`Element`)
                    ├── Identity: { Name: "form", Level: "Element" }
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
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── label (`Element`)
                            ├── Identity: { Name: "label", Level: "Element" }
                        └── Input (`Component`)
                            ├── Identity: { Name: "Input", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── Button (`Component`)
                            ├── Identity: { Name: "Button", Level: "Component" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
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
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                                └── StatusBadge (`Component`)
                                    ├── Identity: { Name: "StatusBadge", Level: "Component" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
                        └── Button (`Component`)
                            ├── Identity: { Name: "Button", Level: "Component" }

└── schedule Page (`Page`)
    ├── Identity: { Name: "schedule Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist/schedule" }
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

└── travel Page (`Page`)
    ├── Identity: { Name: "travel Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist/travel" }
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

└── venue Page (`Page`)
    ├── Identity: { Name: "venue Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/artist/venue" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Artist, Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
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
                        └── h2 (`Element`)
                            ├── Identity: { Name: "h2", Level: "Element" }
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
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
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
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }

└── attendee Page (`Page`)
    ├── Identity: { Name: "attendee Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/attendee" }
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
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }

└── client Page (`Page`)
    ├── Identity: { Name: "client Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/client" }
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
                └── h1 (`Element`)
                    ├── Identity: { Name: "h1", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── Link (`Component`)
                    ├── Identity: { Name: "Link", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── h3 (`Element`)
                            ├── Identity: { Name: "h3", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }

└── deliverables Page (`Page`)
    ├── Identity: { Name: "deliverables Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/client/deliverables" }
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

└── files Page (`Page`)
    ├── Identity: { Name: "files Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/client/files" }
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

└── invoices Page (`Page`)
    ├── Identity: { Name: "invoices Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/client/invoices" }
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

└── messages Page (`Page`)
    ├── Identity: { Name: "messages Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/client/messages" }
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

└── proposals Page (`Page`)
    ├── Identity: { Name: "proposals Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/client/proposals" }
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

└── crew Page (`Page`)
    ├── Identity: { Name: "crew Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/crew" }
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

└── advances Page (`Page`)
    ├── Identity: { Name: "advances Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/crew/advances" }
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

└── call-sheet Page (`Page`)
    ├── Identity: { Name: "call-sheet Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/crew/call-sheet" }
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

└── time Page (`Page`)
    ├── Identity: { Name: "time Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/crew/time" }
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

└── guest Page (`Page`)
    ├── Identity: { Name: "guest Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/guest" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                └── h1 (`Element`)
                    ├── Identity: { Name: "h1", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── Link (`Component`)
                    ├── Identity: { Name: "Link", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── h3 (`Element`)
                            ├── Identity: { Name: "h3", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }

└── logistics Page (`Page`)
    ├── Identity: { Name: "logistics Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/guest/logistics" }
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

└── schedule Page (`Page`)
    ├── Identity: { Name: "schedule Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/guest/schedule" }
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

└── tickets Page (`Page`)
    ├── Identity: { Name: "tickets Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/guest/tickets" }
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

└── management Page (`Page`)
    ├── Identity: { Name: "management Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/management" }
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
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }

└── overview Page (`Page`)
    ├── Identity: { Name: "overview Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/overview" }
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

└── press Page (`Page`)
    ├── Identity: { Name: "press Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/press" }
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
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }

└── production Page (`Page`)
    ├── Identity: { Name: "production Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/production" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor, Client, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                └── h1 (`Element`)
                    ├── Identity: { Name: "h1", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── Link (`Component`)
                    ├── Identity: { Name: "Link", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── h3 (`Element`)
                            ├── Identity: { Name: "h3", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }

└── credentials Page (`Page`)
    ├── Identity: { Name: "credentials Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/production/credentials" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Staff, Vendor, Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── form (`Element`)
                    ├── Identity: { Name: "form", Level: "Element" }
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
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
                            └── option (`Element`)
                                ├── Identity: { Name: "option", Level: "Element" }
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
                        └── Button (`Component`)
                            ├── Identity: { Name: "Button", Level: "Component" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── SectionHeading (`Component`)
                    ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
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
                            └── span (`Element`)
                                ├── Identity: { Name: "span", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── StatusBadge (`Component`)
                                ├── Identity: { Name: "StatusBadge", Level: "Component" }

└── equipment Page (`Page`)
    ├── Identity: { Name: "equipment Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/production/equipment" }
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
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
            └── EmptyState (`Component`)
                ├── Identity: { Name: "EmptyState", Level: "Component" }
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }

└── lost-found Page (`Page`)
    ├── Identity: { Name: "lost-found Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/production/lost-found" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Client, Authenticated ] }
    └── Internal Components:
    └── ModuleHeader Section (`Section`)
        ├── Identity: { Name: "ModuleHeader Section", Level: "Section" }
        └── ModuleHeader (`Component`)
            ├── Identity: { Name: "ModuleHeader", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
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
                            └── StatusBadge (`Component`)
                                ├── Identity: { Name: "StatusBadge", Level: "Component" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
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
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }

└── receiving Page (`Page`)
    ├── Identity: { Name: "receiving Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/production/receiving" }
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
                └── StatCard (`Component`)
                    ├── Identity: { Name: "StatCard", Level: "Component" }
            └── EmptyState (`Component`)
                ├── Identity: { Name: "EmptyState", Level: "Component" }
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }

└── schedules Page (`Page`)
    ├── Identity: { Name: "schedules Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/production/schedules" }
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
            └── DataTable (`Component`)
                ├── Identity: { Name: "DataTable", Level: "Component" }

└── vendor-submissions Page (`Page`)
    ├── Identity: { Name: "vendor-submissions Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/production/vendor-submissions" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor, Client, Authenticated ] }
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
                └── Link (`Component`)
                    ├── Identity: { Name: "Link", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── h3 (`Element`)
                                ├── Identity: { Name: "h3", Level: "Element" }
                            └── StatusBadge (`Component`)
                                ├── Identity: { Name: "StatusBadge", Level: "Component" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }

└── equipment-pull-list Page (`Page`)
    ├── Identity: { Name: "equipment-pull-list Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/production/vendor-submissions/equipment-pull-list" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor, Client, Authenticated ] }
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
                    └── Badge (`Component`)
                        ├── Identity: { Name: "Badge", Level: "Component" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── SectionHeading (`Component`)
                        ├── Identity: { Name: "SectionHeading", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
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
                                    └── input (`Element`)
                                        ├── Identity: { Name: "input", Level: "Element" }
                                    └── div (`Element`)
                                        ├── Identity: { Name: "div", Level: "Element" }
                                        └── span (`Element`)
                                            ├── Identity: { Name: "span", Level: "Element" }
                                        └── span (`Element`)
                                            ├── Identity: { Name: "span", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }
                                    └── Input (`Component`)
                                        ├── Identity: { Name: "Input", Level: "Component" }
                                    └── span (`Element`)
                                        ├── Identity: { Name: "span", Level: "Element" }

└── venue-specs Page (`Page`)
    ├── Identity: { Name: "venue-specs Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/production/venue-specs" }
    ├── Capabilities: [ Database Read (Supabase) ]
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
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── section (`Element`)
                        ├── Identity: { Name: "section", Level: "Element" }
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
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }
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
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
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
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }
                    └── section (`Element`)
                        ├── Identity: { Name: "section", Level: "Element" }
                        └── SectionHeading (`Component`)
                            ├── Identity: { Name: "SectionHeading", Level: "Component" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }

└── sponsor Page (`Page`)
    ├── Identity: { Name: "sponsor Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/sponsor" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Staff, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                └── h1 (`Element`)
                    ├── Identity: { Name: "h1", Level: "Element" }
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── Link (`Component`)
                    ├── Identity: { Name: "Link", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── h3 (`Element`)
                            ├── Identity: { Name: "h3", Level: "Element" }
                        └── p (`Element`)
                            ├── Identity: { Name: "p", Level: "Element" }

└── [tab] Page (`Page`)
    ├── Identity: { Name: "[tab] Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/sponsor/[tab]" }
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
            └── ContentGrid (`Component`)
                ├── Identity: { Name: "ContentGrid", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── EmptyState (`Component`)
                        ├── Identity: { Name: "EmptyState", Level: "Component" }

└── activations Page (`Page`)
    ├── Identity: { Name: "activations Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/sponsor/activations" }
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
    ├── Identity: { Name: "assets Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/sponsor/assets" }
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

└── reporting Page (`Page`)
    ├── Identity: { Name: "reporting Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/sponsor/reporting" }
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

└── staff Page (`Page`)
    ├── Identity: { Name: "staff Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/staff" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Staff, Authenticated ] }
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
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h3 (`Element`)
                        ├── Identity: { Name: "h3", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }

└── vendor Page (`Page`)
    ├── Identity: { Name: "vendor Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/vendor" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Vendor, Authenticated ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── h1 (`Element`)
                ├── Identity: { Name: "h1", Level: "Element" }
            └── p (`Element`)
                ├── Identity: { Name: "p", Level: "Element" }

└── credentials Page (`Page`)
    ├── Identity: { Name: "credentials Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/vendor/credentials" }
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

└── equipment-pull-list Page (`Page`)
    ├── Identity: { Name: "equipment-pull-list Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/vendor/equipment-pull-list" }
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

└── invoices Page (`Page`)
    ├── Identity: { Name: "invoices Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/vendor/invoices" }
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

└── purchase-orders Page (`Page`)
    ├── Identity: { Name: "purchase-orders Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/vendor/purchase-orders" }
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

└── submissions Page (`Page`)
    ├── Identity: { Name: "submissions Page", Level: "Page", Parent: "GVTEWAY", Path: "//app/(portal)/p/[slug]/vendor/submissions" }
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
| **Permission Gaps** | 0 routes relying on inherited/public ACLs |
| **Dangling Dependencies** | 0 strictly unresolved API calls |
