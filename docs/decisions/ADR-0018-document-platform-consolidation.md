# ADR-0018: Document platform consolidation (approvals · e-sign · versioning)

Date: 2026-07-24 · Status: Proposed (design accepted; execution is a phased program, not a single change)

## Context

A full lifecycle audit of every document/media domain (2026-07-24) found the
feature set complete but the plumbing triplicated. Three structural debts
recur across otherwise healthy domains:

1. **Three parallel review systems.** Generic `approval_instances` (POs,
   change orders) · `deliverable_reviewers` + `fulfillment_state`
   (advancing) · per-record status enums (proposals, invoices, contracts,
   offer letters, RAMS, site plans). Nothing is wrong with any one of them;
   the cost is that "what awaits my sign-off" has to be recomputed per domain
   (see `/studio/my-work`'s union query), and every new document type
   re-decides how review works.
2. **Three e-signature implementations.** Proposals
   (`signature_hash`/`signature_data`, typed|canvas, `/proposals/[token]`),
   offer letters (typed signature + IP/UA audit, `/offer/[token]`),
   contracts (`contract_signatures` sub-table). The 29 generated-document
   `sign` blocks are visual placeholders. Each new signable surface picks one
   of the three shapes and diverges a little more.
3. **Versioning is a bare integer everywhere except contracts.**
   `deliverables.version`, `proposals.version`, `advance_packets.version` are
   ints; diffs are reconstructed from `audit_log` before/after images.
   Only `contract_versions` keeps real snapshots with redline summaries.

## Decision

Adopt the target shapes now; migrate opportunistically (each phase has
standalone value, none blocks the others):

- **Approvals**: `approval_instances` is the convergence point — it is
  already polymorphic (`subject_table`/`subject_id`) and already feeds
  My Work. New reviewable records route through `routeToApprovals()` instead
  of inventing enum arcs. The two existing specialized systems stay: the
  fulfillment FSM is a *lifecycle*, not just a review, and deliverable
  multi-reviewer verdicts map poorly onto step policies. The rule is "no
  fourth system."
- **E-sign**: extract a shared `signature_captures` shape
  (subject_table/subject_id, signer identity, method typed|drawn, hash,
  IP/UA, signed_at) with one capture component. Contracts'
  `contract_signatures` is the closest existing model and the template.
  Proposals and offer letters keep their public-token routes but write
  through the shared capture on their next substantive rework.
- **Versioning**: `contract_versions` is the pattern (immutable snapshot
  rows + a summary). Deliverables get it first when re-versioning next
  matters (per-version file retention is the real gap — today a resubmission
  overwrites `file_path` and the prior file is unreachable except through
  storage history).

## Non-goals

No big-bang migration; no schema churn on live arcs that work; no changes to
the fulfillment state machine (it is shared vocabulary across three shells
and the portal token flow).

## Trigger points

- Next new document type with a review step → must use `approval_instances`.
- Next signable surface → must use the shared capture shape (build it then).
- Next deliverables rework → version snapshot table + per-version files.
