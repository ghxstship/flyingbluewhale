import { NextResponse } from 'next/server';

export const metadata = {
  title: 'API Documentation -- GVTEWAY',
};

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GVTEWAY API Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0A0A0A; color: #F5F5F5; font-family: 'Share Tech', sans-serif; }
    .header { padding: 2rem; border-bottom: 1px solid #2A2A2A; }
    .header h1 { font-family: 'Anton', sans-serif; font-size: 2rem; text-transform: uppercase; letter-spacing: 0.02em; }
    .header p { color: #A0A0A0; margin-top: 0.5rem; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .endpoint { background: #121212; border: 1px solid #2A2A2A; border-radius: 0.5rem; margin-bottom: 1rem; overflow: hidden; }
    .endpoint-header { padding: 1rem 1.5rem; display: flex; align-items: center; gap: 0.75rem; cursor: pointer; }
    .endpoint-header:hover { background: rgba(0, 229, 255, 0.03); }
    .method { padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.625rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; }
    .method-get { background: rgba(68, 138, 255, 0.15); color: #448AFF; border: 1px solid rgba(68, 138, 255, 0.3); }
    .method-post { background: rgba(0, 230, 118, 0.15); color: #00E676; border: 1px solid rgba(0, 230, 118, 0.3); }
    .method-patch { background: rgba(255, 215, 64, 0.15); color: #FFD740; border: 1px solid rgba(255, 215, 64, 0.3); }
    .method-delete { background: rgba(255, 82, 82, 0.15); color: #FF5252; border: 1px solid rgba(255, 82, 82, 0.3); }
    .path { font-family: monospace; color: #F5F5F5; }
    .summary { color: #A0A0A0; font-size: 0.875rem; margin-left: auto; }
    .tag { padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; border: 1px solid rgba(0, 229, 255, 0.2); color: #00E5FF; background: rgba(0, 229, 255, 0.08); }
    .auth-note { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 2rem; }
    .auth-note h3 { font-size: 0.875rem; color: #00E5FF; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .auth-note p { color: #A0A0A0; font-size: 0.875rem; }
    code { background: #1A1A1A; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.8125rem; color: #00E5FF; }
    .section-title { font-family: 'Bebas Neue', sans-serif; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; color: #666; margin: 2rem 0 1rem; }
  </style>
</head>
<body>
  <div class="header">
    <div class="container">
      <h1>GVTEWAY API <span style="color: #00E5FF">v1</span></h1>
      <p>Universal Production Advancing REST API &middot; OpenAPI 3.1</p>
    </div>
  </div>
  <div class="container">
    <div class="auth-note">
      <h3>Authentication</h3>
      <p>All endpoints require authentication via <code>Authorization: Bearer &lt;token&gt;</code> or <code>apikey: &lt;key&gt;</code> header. Responses are filtered by Row-Level Security based on the authenticated user's role.</p>
    </div>

    <div class="section-title">Projects</div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-get">GET</span><span class="path">/api/v1/projects</span><span class="summary">List projects</span><span class="tag">Projects</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-post">POST</span><span class="path">/api/v1/projects</span><span class="summary">Create project</span><span class="tag">Projects</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-get">GET</span><span class="path">/api/v1/projects/{id}</span><span class="summary">Get project detail</span><span class="tag">Projects</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-patch">PATCH</span><span class="path">/api/v1/projects/{id}</span><span class="summary">Update project</span><span class="tag">Projects</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-delete">DELETE</span><span class="path">/api/v1/projects/{id}</span><span class="summary">Archive project</span><span class="tag">Projects</span></div></div>

    <div class="section-title">Catalog</div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-get">GET</span><span class="path">/api/v1/catalog/groups</span><span class="summary">List catalog groups with categories</span><span class="tag">Catalog</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-get">GET</span><span class="path">/api/v1/catalog/items</span><span class="summary">List items (role-filtered)</span><span class="tag">Catalog</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-post">POST</span><span class="path">/api/v1/catalog/items</span><span class="summary">Create catalog item</span><span class="tag">Catalog</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-get">GET</span><span class="path">/api/v1/catalog/items/{id}</span><span class="summary">Get item with intelligence</span><span class="tag">Catalog</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-patch">PATCH</span><span class="path">/api/v1/catalog/items/{id}</span><span class="summary">Update catalog item</span><span class="tag">Catalog</span></div></div>

    <div class="section-title">Deliverables</div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-get">GET</span><span class="path">/api/v1/deliverables</span><span class="summary">List deliverables</span><span class="tag">Deliverables</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-post">POST</span><span class="path">/api/v1/deliverables</span><span class="summary">Create deliverable</span><span class="tag">Deliverables</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-get">GET</span><span class="path">/api/v1/deliverables/{id}</span><span class="summary">Get deliverable with history</span><span class="tag">Deliverables</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-patch">PATCH</span><span class="path">/api/v1/deliverables/{id}</span><span class="summary">Update / transition status</span><span class="tag">Deliverables</span></div></div>

    <div class="section-title">Allocations</div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-get">GET</span><span class="path">/api/v1/allocations</span><span class="summary">List allocations</span><span class="tag">Allocations</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-post">POST</span><span class="path">/api/v1/allocations</span><span class="summary">Reserve equipment</span><span class="tag">Allocations</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-patch">PATCH</span><span class="path">/api/v1/allocations/{id}</span><span class="summary">Transition state</span><span class="tag">Allocations</span></div></div>

    <div class="section-title">Catering</div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-get">GET</span><span class="path">/api/v1/catering/meals</span><span class="summary">List meal plans</span><span class="tag">Catering</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-post">POST</span><span class="path">/api/v1/catering/meals</span><span class="summary">Create meal plan</span><span class="tag">Catering</span></div></div>

    <div class="section-title">Notifications &amp; Webhooks</div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-post">POST</span><span class="path">/api/v1/notifications</span><span class="summary">Send notification</span><span class="tag">Notifications</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-post">POST</span><span class="path">/api/v1/webhooks</span><span class="summary">Register webhook</span><span class="tag">Webhooks</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method method-delete">DELETE</span><span class="path">/api/v1/webhooks/{id}</span><span class="summary">Unregister webhook</span><span class="tag">Webhooks</span></div></div>

    <div style="text-align: center; margin-top: 3rem; padding: 2rem 0; border-top: 1px solid #1E1E1E;">
      <p style="color: #444; font-size: 0.75rem;">GVTEWAY &middot; GHXSTSHIP &copy; 2026 &middot; <a href="/api/v1" style="color: #00E5FF;">OpenAPI JSON</a></p>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
