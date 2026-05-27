/**
 * GraphQL schema — Round 76 (G-031).
 *
 * Wraps the canonical read entities for partner integrations. Schema-first
 * SDL; resolvers live in ./resolvers.ts. Covers the entities most asked
 * about in third-party integrations (Procore Connect-style):
 *
 *   - Org / current viewer
 *   - Projects + per-project rollups (rfis, submittals, daily_logs, tasks)
 *   - Finance: invoices, expenses, payment_applications, entities
 *   - Procurement: vendors, clients
 *   - Drawings: site_plans
 *
 * All queries are org-scoped via the request context's session (private RLS
 * is also enforced by Supabase, so the GraphQL layer is the second guard,
 * not the only guard).
 */

export const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar JSON

  type Viewer {
    userId: ID!
    email: String!
    orgId: ID!
    orgSlug: String!
    role: String!
  }

  type Org {
    id: ID!
    slug: String!
    name: String!
    defaultCurrency: String!
    defaultLocale: String!
    defaultTimezone: String!
  }

  type Project {
    id: ID!
    name: String!
    code: String
    status: String
    startDate: String
    endDate: String
    address: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Rfi {
    id: ID!
    projectId: ID
    number: String
    title: String
    status: String
    dueAt: String
    askedAt: DateTime
    askedBy: ID
    answeredAt: DateTime
    answeredBy: ID
    createdAt: DateTime!
  }

  type Submittal {
    id: ID!
    projectId: ID
    number: String
    title: String
    status: String
    submittedAt: DateTime
    requiredAt: String
    createdAt: DateTime!
  }

  type DailyLog {
    id: ID!
    projectId: ID
    logDate: String
    summary: String
    weatherTempHighF: Float
    weatherTempLowF: Float
    weatherPrecipIn: Float
    weatherConditions: String
    weatherSource: String
    createdAt: DateTime!
  }

  type Task {
    id: ID!
    projectId: ID
    title: String!
    description: String
    status: String
    priority: String
    assigneeId: ID
    dueAt: String
    createdAt: DateTime!
  }

  type Invoice {
    id: ID!
    projectId: ID
    clientId: ID
    entityId: ID
    number: String!
    title: String!
    amountCents: Float!
    currency: String!
    status: String!
    issuedAt: String
    dueAt: String
    paidAt: DateTime
    baseCurrency: String
    baseAmountCents: Float
    fxRateToBase: Float
    createdAt: DateTime!
  }

  type Expense {
    id: ID!
    projectId: ID
    entityId: ID
    submitterId: ID!
    category: String
    description: String!
    amountCents: Float!
    currency: String!
    status: String!
    spentAt: String!
    baseCurrency: String
    baseAmountCents: Float
    createdAt: DateTime!
  }

  type OrgEntity {
    id: ID!
    legalName: String!
    shortCode: String!
    baseCurrency: String!
    jurisdiction: String
    consolidationMethod: String!
    ownershipPct: Float!
    consolidationState: String!
    parentEntityId: ID
    effectiveFrom: String!
    effectiveTo: String
  }

  type Vendor {
    id: ID!
    name: String!
    email: String
    phone: String
    website: String
    createdAt: DateTime!
  }

  type Client {
    id: ID!
    name: String!
    email: String
    phone: String
    createdAt: DateTime!
  }

  type SitePlan {
    id: ID!
    projectId: ID
    name: String
    sheetNumber: String
    revision: Int
    pageCount: Int
    createdAt: DateTime!
  }

  input PageInput {
    limit: Int = 50
    offset: Int = 0
  }

  type Query {
    """
    The current authenticated viewer + their org context.
    """
    viewer: Viewer!

    """
    The org for the current viewer.
    """
    org: Org!

    project(id: ID!): Project
    projects(page: PageInput): [Project!]!

    rfi(id: ID!): Rfi
    rfis(projectId: ID, page: PageInput): [Rfi!]!

    submittal(id: ID!): Submittal
    submittals(projectId: ID, page: PageInput): [Submittal!]!

    dailyLog(id: ID!): DailyLog
    dailyLogs(projectId: ID, page: PageInput): [DailyLog!]!

    task(id: ID!): Task
    tasks(projectId: ID, page: PageInput): [Task!]!

    invoice(id: ID!): Invoice
    invoices(projectId: ID, entityId: ID, page: PageInput): [Invoice!]!

    expense(id: ID!): Expense
    expenses(projectId: ID, entityId: ID, page: PageInput): [Expense!]!

    orgEntity(id: ID!): OrgEntity
    orgEntities: [OrgEntity!]!

    vendor(id: ID!): Vendor
    vendors(page: PageInput): [Vendor!]!

    client(id: ID!): Client
    clients(page: PageInput): [Client!]!

    sitePlan(id: ID!): SitePlan
    sitePlans(projectId: ID, page: PageInput): [SitePlan!]!
  }
`;
