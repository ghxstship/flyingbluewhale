import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs } from "@/lib/graphql/schema";
import { resolvers } from "@/lib/graphql/resolvers";
import { buildGqlContext, type GqlContext } from "@/lib/graphql/context";
import { apiError } from "@/lib/api";

/**
 * GraphQL endpoint — Round 76 (G-031).
 *
 * Wraps the canonical read entities for partner integrations using
 * graphql-yoga (the 2026 canonical choice — actively maintained,
 * lightweight, works natively in Next.js App Router route handlers).
 *
 * Auth: every request resolves through buildGqlContext() → requireSession()
 * before any resolver runs. RLS at the database layer is the second guard.
 *
 * Browse the schema (dev): GET /api/v1/graphql renders the GraphiQL UI.
 * Production: POST { query, variables } with a session cookie.
 */

const yoga = createYoga<GqlContext>({
  schema: createSchema({ typeDefs, resolvers: resolvers as never }),
  graphqlEndpoint: "/api/v1/graphql",
  context: () => buildGqlContext(),
  graphiql: process.env.NODE_ENV !== "production",
  cors: false,
  landingPage: false,
});

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    return await yoga.handle(req, {} as never);
  } catch {
    return apiError("internal", "GraphQL handler error");
  }
}

export async function POST(req: Request) {
  try {
    return await yoga.handle(req, {} as never);
  } catch {
    return apiError("internal", "GraphQL handler error");
  }
}

export async function OPTIONS(req: Request) {
  try {
    return await yoga.handle(req, {} as never);
  } catch {
    return apiError("internal", "GraphQL handler error");
  }
}
