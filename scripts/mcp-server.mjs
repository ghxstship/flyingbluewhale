#!/usr/bin/env node
/**
 * ATLVS MCP server (P3.c) — exposes ATLVS data to MCP-capable AI clients
 * (Claude Desktop, Cursor, etc.) as tools, wrapping the existing
 * PAT-authenticated `/api/v1/*` endpoints.
 *
 * Dependency-free by design — matches the repo's "no SDK" pattern (the
 * Stripe webhook verifies HMAC by hand; charts avoid recharts where an
 * SVG will do). This speaks the MCP stdio transport directly:
 * newline-delimited JSON-RPC 2.0 on stdin/stdout.
 *
 * Auth + scoping: every tool call hits the live API with the operator's
 * Personal Access Token, so RLS + capability checks apply exactly as they
 * do in the app. The MCP server adds no new trust — it's a thin proxy.
 *
 * Config (env):
 *   ATLVS_BASE_URL   e.g. https://atlvs.pro   (default http://localhost:3000)
 *   ATLVS_PAT        a Personal Access Token (sk_…) with the desired scope
 *
 * Install (Claude Desktop / Cursor mcp config):
 *   { "command": "node", "args": ["scripts/mcp-server.mjs"],
 *     "env": { "ATLVS_BASE_URL": "https://atlvs.pro", "ATLVS_PAT": "sk_…" } }
 */

const BASE_URL = (process.env.ATLVS_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const PAT = process.env.ATLVS_PAT || "";
const PROTOCOL_VERSION = "2024-11-05";

/** Curated read-only tools. Each maps to a GET on an existing /api/v1 route. */
const TOOLS = [
  {
    name: "atlvs_list_projects",
    description: "List projects in the authenticated org (paginated, newest first).",
    inputSchema: {
      type: "object",
      properties: { cursor: { type: "string", description: "Opaque pagination cursor from a prior call." } },
    },
    run: async (args) => apiGet(`/api/v1/projects${args?.cursor ? `?cursor=${encodeURIComponent(args.cursor)}` : ""}`),
  },
  {
    name: "atlvs_get_project",
    description: "Get a single project by id.",
    inputSchema: {
      type: "object",
      properties: { projectId: { type: "string", description: "Project UUID." } },
      required: ["projectId"],
    },
    run: async (args) => apiGet(`/api/v1/projects/${encodeURIComponent(args.projectId)}`),
  },
  {
    name: "atlvs_list_stage_plots",
    description: "List stage plots, optionally filtered to a project.",
    inputSchema: {
      type: "object",
      properties: { projectId: { type: "string", description: "Optional project UUID filter." } },
    },
    run: async (args) =>
      apiGet(`/api/v1/stage-plots${args?.projectId ? `?projectId=${encodeURIComponent(args.projectId)}` : ""}`),
  },
];

async function apiGet(path) {
  if (!PAT) {
    return { error: "ATLVS_PAT is not set — export a Personal Access Token (sk_…) to authenticate." };
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${PAT}`, Accept: "application/json" },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!res.ok) return { error: `HTTP ${res.status}`, body };
  return body;
}

// ── MCP JSON-RPC plumbing ────────────────────────────────────────────────
function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

function result(id, payload) {
  send({ jsonrpc: "2.0", id, result: payload });
}

function error(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}

async function handle(msg) {
  const { id, method, params } = msg;

  // Notifications (no id) — acknowledge silently.
  if (id === undefined || id === null) return;

  switch (method) {
    case "initialize":
      return result(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: "atlvs", version: "0.1.0" },
      });
    case "ping":
      return result(id, {});
    case "tools/list":
      return result(id, {
        tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
      });
    case "tools/call": {
      const tool = TOOLS.find((t) => t.name === params?.name);
      if (!tool) return error(id, -32602, `Unknown tool: ${params?.name}`);
      try {
        const out = await tool.run(params?.arguments || {});
        return result(id, { content: [{ type: "text", text: JSON.stringify(out, null, 2) }] });
      } catch (e) {
        return result(id, {
          isError: true,
          content: [{ type: "text", text: `Tool failed: ${e instanceof Error ? e.message : String(e)}` }],
        });
      }
    }
    default:
      return error(id, -32601, `Method not found: ${method}`);
  }
}

// Newline-delimited JSON-RPC on stdin.
let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    void handle(msg);
  }
});
process.stdin.on("end", () => process.exit(0));
