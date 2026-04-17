# Deep Site Map & Workflow Inventory: Core Utilities

> *Generated via complete 5-level AST tracing*

```text
Core Utilities
└── api-response Utility module (`Utility module`)
    ├── Identity: { Name: "api-response Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/api/api-response" }
    ├── Capabilities: [ Database Read (Supabase), Database Mutation, API Execution ]
    ├── RBAC: { VisibleTo: [ Authenticated, Client ] }

└── guards Utility module (`Utility module`)
    ├── Identity: { Name: "guards Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/api/guards" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── inventory Utility module (`Utility module`)
    ├── Identity: { Name: "inventory Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/api/inventory" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── response Utility module (`Utility module`)
    ├── Identity: { Name: "response Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/api/response" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── index Utility module (`Utility module`)
    ├── Identity: { Name: "index Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/api/schemas/index" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── resolve-org-client Utility module (`Utility module`)
    ├── Identity: { Name: "resolve-org-client Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/auth/resolve-org-client" }
    ├── Capabilities: [ Database Read (Supabase) ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── env Utility module (`Utility module`)
    ├── Identity: { Name: "env Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/env" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── motion Component (`Component`)
    ├── Identity: { Name: "motion Component", Level: "Component", Parent: "Core Utilities", Path: "//lib/motion" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── logger Utility module (`Utility module`)
    ├── Identity: { Name: "logger Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/observability/logger" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── capabilities Utility module (`Utility module`)
    ├── Identity: { Name: "capabilities Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/rbac/capabilities" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Authenticated, Admin ] }

└── capabilities.test Utility module (`Utility module`)
    ├── Identity: { Name: "capabilities.test Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/rbac/capabilities.test" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Admin ] }

└── cast-relation Utility module (`Utility module`)
    ├── Identity: { Name: "cast-relation Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/supabase/cast-relation" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── client Utility module (`Utility module`)
    ├── Identity: { Name: "client Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/supabase/client" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── database.types Utility module (`Utility module`)
    ├── Identity: { Name: "database.types Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/supabase/database.types" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Public / Inherited ] }

└── server Utility module (`Utility module`)
    ├── Identity: { Name: "server Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/supabase/server" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Client ] }

└── types Utility module (`Utility module`)
    ├── Identity: { Name: "types Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/supabase/types" }
    ├── Capabilities: [ Static Module ]
    ├── RBAC: { VisibleTo: [ Admin, Vendor ] }

└── utils Utility module (`Utility module`)
    ├── Identity: { Name: "utils Utility module", Level: "Utility module", Parent: "Core Utilities", Path: "//lib/utils" }
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
