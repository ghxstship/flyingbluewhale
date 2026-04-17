# Deep Site Map & Workflow Inventory: Shared Library

> *Generated via complete 5-level AST tracing*

```text
Shared Library
└── app Layout (`Layout`)
    ├── Identity: { Name: "app Layout", Level: "Layout", Parent: "Shared Library", Path: "//app" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── html Section (`Section`)
        ├── Identity: { Name: "html Section", Level: "Section" }
        └── html (`Element`)
            ├── Identity: { Name: "html", Level: "Element" }
            └── body (`Element`)
                ├── Identity: { Name: "body", Level: "Element" }
                └── script (`Element`)
                    ├── Identity: { Name: "script", Level: "Element" }
                └── a (`Element`)
                    ├── Identity: { Name: "a", Level: "Element" }
                └── ThemeProvider (`Component`)
                    ├── Identity: { Name: "ThemeProvider", Level: "Component" }
                    └── main (`Element`)
                        ├── Identity: { Name: "main", Level: "Element" }
                └── Toaster (`Component`)
                    ├── Identity: { Name: "Toaster", Level: "Component" }
                └── script (`Element`)
                    ├── Identity: { Name: "script", Level: "Element" }

└── app Page (`Page`)
    ├── Identity: { Name: "app Page", Level: "Page", Parent: "Shared Library", Path: "//app" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── div Section (`Section`)
        ├── Identity: { Name: "div Section", Level: "Section" }
        └── div (`Element`)
            ├── Identity: { Name: "div", Level: "Element" }
            └── nav (`Element`)
                ├── Identity: { Name: "nav", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Link (`Component`)
                        ├── Identity: { Name: "Link", Level: "Component" }
                    └── Link (`Component`)
                        ├── Identity: { Name: "Link", Level: "Component" }
            └── section (`Element`)
                ├── Identity: { Name: "section", Level: "Element" }
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
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── Link (`Component`)
                            ├── Identity: { Name: "Link", Level: "Component" }
                        └── Link (`Component`)
                            ├── Identity: { Name: "Link", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── FeatureCard (`Component`)
                        ├── Identity: { Name: "FeatureCard", Level: "Component" }
                    └── FeatureCard (`Component`)
                        ├── Identity: { Name: "FeatureCard", Level: "Component" }
                    └── FeatureCard (`Component`)
                        ├── Identity: { Name: "FeatureCard", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
            └── footer (`Element`)
                ├── Identity: { Name: "footer", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
                └── span (`Element`)
                    ├── Identity: { Name: "span", Level: "Element" }

└── [token] Page (`Page`)
    ├── Identity: { Name: "[token] Page", Level: "Page", Parent: "Shared Library", Path: "//app/(auth)/accept-invite/[token]" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
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
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }

└── forgot-password Page (`Page`)
    ├── Identity: { Name: "forgot-password Page", Level: "Page", Parent: "Shared Library", Path: "//app/(auth)/forgot-password" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
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
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }

└── login Page (`Page`)
    ├── Identity: { Name: "login Page", Level: "Page", Parent: "Shared Library", Path: "//app/(auth)/login" }
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
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
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
                        └── Behavior: "Invokes: mode === 'password' ? passwordAction : magicAction"
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
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── button (`Element`)
                        ├── Identity: { Name: "button", Level: "Element" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: () => setMode(mode === 'password' ? 'magic' : 'pas..."
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
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                    └── a (`Element`)
                        ├── Identity: { Name: "a", Level: "Element" }

└── actions Utility module (`Utility module`)
    ├── Identity: { Name: "actions Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/(auth)/login/actions" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Authenticated, Client ] }

└── [token] Page (`Page`)
    ├── Identity: { Name: "[token] Page", Level: "Page", Parent: "Shared Library", Path: "//app/(auth)/magic-link/[token]" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
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
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }

└── [token] Page (`Page`)
    ├── Identity: { Name: "[token] Page", Level: "Page", Parent: "Shared Library", Path: "//app/(auth)/reset-password/[token]" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
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
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }

└── signup Page (`Page`)
    ├── Identity: { Name: "signup Page", Level: "Page", Parent: "Shared Library", Path: "//app/(auth)/signup" }
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
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
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
                        └── Behavior: "Invokes: formAction"
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
                        └── Input (`Component`)
                            ├── Identity: { Name: "Input", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── label (`Element`)
                            ├── Identity: { Name: "label", Level: "Element" }
                        └── Input (`Component`)
                            ├── Identity: { Name: "Input", Level: "Component" }
                    └── Button (`Component`)
                        ├── Identity: { Name: "Button", Level: "Component" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                    └── a (`Element`)
                        ├── Identity: { Name: "a", Level: "Element" }

└── actions Utility module (`Utility module`)
    ├── Identity: { Name: "actions Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/(auth)/signup/actions" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Authenticated, Client ] }

└── [provider] Page (`Page`)
    ├── Identity: { Name: "[provider] Page", Level: "Page", Parent: "Shared Library", Path: "//app/(auth)/sso/[provider]" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
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
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }

└── [token] Page (`Page`)
    ├── Identity: { Name: "[token] Page", Level: "Page", Parent: "Shared Library", Path: "//app/(auth)/verify-email/[token]" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
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
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }

└── (marketing) Layout (`Layout`)
    ├── Identity: { Name: "(marketing) Layout", Level: "Layout", Parent: "Shared Library", Path: "//app/(marketing)" }
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
                    └── Link (`Component`)
                        ├── Identity: { Name: "Link", Level: "Component" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                    └── nav (`Element`)
                        ├── Identity: { Name: "nav", Level: "Element" }
                        └── Link (`Component`)
                            ├── Identity: { Name: "Link", Level: "Component" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── Link (`Component`)
                            ├── Identity: { Name: "Link", Level: "Component" }
                        └── Link (`Component`)
                            ├── Identity: { Name: "Link", Level: "Component" }
            └── main (`Element`)
                ├── Identity: { Name: "main", Level: "Element" }
            └── footer (`Element`)
                ├── Identity: { Name: "footer", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                        └── Link (`Component`)
                            ├── Identity: { Name: "Link", Level: "Component" }
                        └── Link (`Component`)
                            ├── Identity: { Name: "Link", Level: "Component" }
                        └── Link (`Component`)
                            ├── Identity: { Name: "Link", Level: "Component" }

└── about Page (`Page`)
    ├── Identity: { Name: "about Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/about" }
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

└── blog Page (`Page`)
    ├── Identity: { Name: "blog Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/blog" }
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

└── [slug] Page (`Page`)
    ├── Identity: { Name: "[slug] Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/blog/[slug]" }
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

└── changelog Page (`Page`)
    ├── Identity: { Name: "changelog Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/changelog" }
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

└── contact Page (`Page`)
    ├── Identity: { Name: "contact Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/contact" }
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

└── features Page (`Page`)
    ├── Identity: { Name: "features Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/features" }
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

└── [module] Page (`Page`)
    ├── Identity: { Name: "[module] Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/features/[module]" }
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

└── dpa Page (`Page`)
    ├── Identity: { Name: "dpa Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/legal/dpa" }
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

└── privacy Page (`Page`)
    ├── Identity: { Name: "privacy Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/legal/privacy" }
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

└── sla Page (`Page`)
    ├── Identity: { Name: "sla Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/legal/sla" }
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

└── terms Page (`Page`)
    ├── Identity: { Name: "terms Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/legal/terms" }
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

└── pricing Page (`Page`)
    ├── Identity: { Name: "pricing Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/pricing" }
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

└── [industry] Page (`Page`)
    ├── Identity: { Name: "[industry] Page", Level: "Page", Parent: "Shared Library", Path: "//app/(marketing)/solutions/[industry]" }
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

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/auth/signout/route" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Authenticated, Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/health/route" }
    ├── Capabilities: [ Data Fetching ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/allocations/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/assets/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/audit-log/route" }
    ├── Capabilities: [ API Execution ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/catalog/items/route" }
    ├── Capabilities: [ Database Mutation, API Execution ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/check-in/scan/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/credentials/orders/[id]/transition/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/credentials/orders/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/deliverables/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/docs/route" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/documents/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/entity-assets/[id]/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation, API Execution ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/entity-assets/route" }
    ├── Capabilities: [ Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/fulfillment/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/locations/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/lost-found/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/master-schedule/conflicts/route" }
    ├── Capabilities: [ Database Read (Supabase), API Execution ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/master-schedule/export/route" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/master-schedule/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation, API Execution ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/projects/route" }
    ├── Capabilities: [ Database Mutation, API Execution ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/purchase-orders/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/receiving/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/route" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/schedules/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/shipments/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/tickets/[id]/scan/route" }
    ├── Capabilities: [ API Execution ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/tickets/[id]/transfer/route" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/tickets/promo/validate/route" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/tickets/route" }
    ├── Capabilities: [ API Execution ]
    ├── RBAC: { VisibleTo: [ Authenticated ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/tickets/tiers/route" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/api/v1/vendors/route" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/auth/callback/route" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Authenticated, Client ] }

└── route Utility module (`Utility module`)
    ├── Identity: { Name: "route Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/auth/resolve/route" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Authenticated, Client ] }

└── [slug] Page (`Page`)
    ├── Identity: { Name: "[slug] Page", Level: "Page", Parent: "Shared Library", Path: "//app/check-in/[slug]" }
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
                └── Link (`Component`)
                    ├── Identity: { Name: "Link", Level: "Component" }
            └── div (`Element`)
                ├── Identity: { Name: "div", Level: "Element" }
                └── h1 (`Element`)
                    ├── Identity: { Name: "h1", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── CheckInScanner (`Component`)
                    ├── Identity: { Name: "CheckInScanner", Level: "Component" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── button (`Element`)
                        ├── Identity: { Name: "button", Level: "Element" }
                        └── span (`Element`)
                            ├── Identity: { Name: "span", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── h3 (`Element`)
                                ├── Identity: { Name: "h3", Level: "Element" }
                            └── p (`Element`)
                                ├── Identity: { Name: "p", Level: "Element" }
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

└── dashboard Page (`Page`)
    ├── Identity: { Name: "dashboard Page", Level: "Page", Parent: "Shared Library", Path: "//app/check-in/[slug]/dashboard" }
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
                    └── Link (`Component`)
                        ├── Identity: { Name: "Link", Level: "Component" }
                    └── span (`Element`)
                        ├── Identity: { Name: "span", Level: "Element" }
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
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
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
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                            └── h2 (`Element`)
                                ├── Identity: { Name: "h2", Level: "Element" }
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
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
                        └── div (`Element`)
                            ├── Identity: { Name: "div", Level: "Element" }
                            └── div (`Element`)
                                ├── Identity: { Name: "div", Level: "Element" }
                                └── div (`Element`)
                                    ├── Identity: { Name: "div", Level: "Element" }
                                └── span (`Element`)
                                    ├── Identity: { Name: "span", Level: "Element" }

└── global-error Component (`Component`)
    ├── Identity: { Name: "global-error Component", Level: "Component", Parent: "Shared Library", Path: "//app/global-error" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }
    └── Internal Components:
    └── html Section (`Section`)
        ├── Identity: { Name: "html Section", Level: "Section" }
        └── html (`Element`)
            ├── Identity: { Name: "html", Level: "Element" }
            └── body (`Element`)
                ├── Identity: { Name: "body", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── div (`Element`)
                        ├── Identity: { Name: "div", Level: "Element" }
                    └── h1 (`Element`)
                        ├── Identity: { Name: "h1", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── p (`Element`)
                        ├── Identity: { Name: "p", Level: "Element" }
                    └── button (`Element`)
                        ├── Identity: { Name: "button", Level: "Element" }
                        └── onClick (`Micro-Interaction`)
                            ├── Identity: { Name: "onClick", Level: "Micro-Interaction" }
                            └── Behavior: "Invokes: reset"

└── loading Component (`Component`)
    ├── Identity: { Name: "loading Component", Level: "Component", Parent: "Shared Library", Path: "//app/loading" }
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
                └── span (`Element`)
                    ├── Identity: { Name: "span", Level: "Element" }

└── not-found Component (`Component`)
    ├── Identity: { Name: "not-found Component", Level: "Component", Parent: "Shared Library", Path: "//app/not-found" }
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
                └── h1 (`Element`)
                    ├── Identity: { Name: "h1", Level: "Element" }
                └── p (`Element`)
                    ├── Identity: { Name: "p", Level: "Element" }
                └── div (`Element`)
                    ├── Identity: { Name: "div", Level: "Element" }
                    └── Link (`Component`)
                        ├── Identity: { Name: "Link", Level: "Component" }
                    └── Link (`Component`)
                        ├── Identity: { Name: "Link", Level: "Component" }

└── robots Utility module (`Utility module`)
    ├── Identity: { Name: "robots Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/robots" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── sitemap Utility module (`Utility module`)
    ├── Identity: { Name: "sitemap Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//app/sitemap" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── roles Utility module (`Utility module`)
    ├── Identity: { Name: "roles Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//config/roles" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Admin, Staff, Vendor, Client ] }

└── middleware Utility module (`Utility module`)
    ├── Identity: { Name: "middleware Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//middleware" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Authenticated, Client ] }

└── database Utility module (`Utility module`)
    ├── Identity: { Name: "database Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//types/database" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── database-erp Utility module (`Utility module`)
    ├── Identity: { Name: "database-erp Utility module", Level: "Utility module", Parent: "Shared Library", Path: "//types/database-erp" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

```

## Quality Flags

| Flag Type | Finding |
|---|---|
| **Orphaned Elements** | 0 detected |
| **Dead-End Workflows** | 0 mapped pages without explicit action triggers/forms |
| **Permission Gaps** | 0 routes relying on inherited/public ACLs |
| **Dangling Dependencies** | 0 strictly unresolved API calls |
