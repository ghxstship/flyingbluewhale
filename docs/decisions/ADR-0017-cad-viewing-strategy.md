# ADR-0017: CAD viewing strategy (PDF canon · DXF free tier · APS escalation)

Date: 2026-07-24 · Status: Accepted (tiers 1–2 shipped; tier 3 designed, awaiting credentials)

## Context

Site plans and CAD models enter the platform through two registers:

- `site_plans` — sheet register with `document_state` (draft → in_review → approved → issued → superseded → as_built), PDF in the `site-plans` bucket, PDF.js markup at `/studio/site-plans/[id]/markup` (Bluebeam-convention page-space geometry), pins in `site_plan_pins` (%-coords).
- `bim_models` — model register (`bim_source_type`: ifc/ifc_zip/rvt/nwd/nwc/glb/gltf/fbx/dwg/dxf), file in the `bim` bucket, three.js + web-ifc viewer at `/studio/bim/[id]/view`.

Before this ADR, web-viewable formats were exactly **IFC** (3D) and **PDF** (2D). Everything else — DWG, DXF, RVT, NWD/NWC, and even GLB/glTF/FBX — was metadata + signed-URL download. The UI copy referenced "the Autodesk Forge integration" that does not exist in the codebase. And the field shell had no plan surface at all.

## Decision

Three tiers, cheapest first:

1. **PDF is the canonical site-plan exchange format.** The live-events industry trades plans as PDF (the markup layer already stores geometry in PDF page space). Every released sheet must have a PDF in `site-plans`; the field reads it at `/m/plans` (PDF.js on-device render, pins overlaid, Cache Storage offline copy). CAD-native files are supplements, not the release artifact.
2. **DXF is the free CAD on-ramp** (shipped with this ADR). `dxf-viewer` (npm, lazy-loaded, vendors its own three@0.161 isolated from our 0.180) renders `source_type = 'dxf'` models at `/studio/bim/[id]/view`. Any vendor holding a DWG can export DXF; we never parse DWG ourselves — it is a closed format with no credible pure-client renderer.
3. **Native DWG / RVT / NWD / NWC escalate to Autodesk Platform Services (APS) Model Derivative** — designed here, not yet implemented, because it requires paid credentials and a per-translation cost model:
   - Env: `APS_CLIENT_ID` / `APS_CLIENT_SECRET` (2-legged OAuth, server-side only).
   - Flow: upload to an APS OSS bucket → POST a translate job (SVF2) → poll manifest → store `aps_urn` + derivative state on `bim_models` → embed the hosted Autodesk Viewer for those source types.
   - CSP: `next.config.ts` `headers()` must allowlist `https://developer.api.autodesk.com` (script/style/connect/img/font for the viewer bundle) — scoped to the viewer route if practical.
   - Cost gate: translations bill cloud credits; gate per-org (settings toggle) before wiring the upload hook.
   - Fallback stays what it is today: the "download and open locally" card.

Rejected alternatives: ODA File Converter self-hosting (license agreement + an extra service to run, revisit only if APS pricing fails); server-side DWG→DXF via LibreDWG (fidelity too poor for issued drawings).

## Consequences

- The field finally sees drawings (`/m/plans`, offline-capable) without any new format work — tier 1 rides the existing PDF pipeline.
- `dxf` was added to the `bim_source_type` enum (migration `20260724133215`); the registration form offers it; the viewer routes it to the DXF client.
- GLB/glTF/FBX remain download-only. If a real need appears they are one `<model-viewer>`/three GLTFLoader step away, but nobody has asked.
- The aspirational "Forge" copy in the unsupported-format card is now backed by an actual design with named env keys instead of vapor.
