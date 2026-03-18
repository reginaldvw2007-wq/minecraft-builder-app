# Phase 1 Backlog

## Objective

Turn the current local prototype into a secure preview-ready foundation without adding
production hosting or vendor lock-in.

## Active Workstreams

### 1. Architecture boundary

- Status: in progress
- Artifact: `docs/ANALYSIS_SERVICE_CONTRACT.md`
- Acceptance:
  - UI depends on a provider-neutral analyzer interface
  - mock analysis remains usable offline
  - future model-backed service can return normalized dimensions, openings, layers, and stages

### 2. Builder implementation hardening

- Status: in progress
- Evidence:
  - export path added in `src/lib/exportBuildPlan.ts`
  - analyzer entrypoint extracted in `src/lib/analysis/mockAnalyzer.ts`
  - upload validation added in `src/lib/validateSources.ts`
  - regression tests added in `src/lib/generateBuildPlan.test.ts`
- Acceptance:
  - upload flow remains intact
  - export artifacts are stable
  - generator and export logic are test-covered

### 3. QA and verification

- Status: drafted
- Artifact: `docs/VERIFICATION_CRITERIA.md`
- Acceptance:
  - automated regression commands are required
  - manual smoke path exists for upload + export
  - mock limitations are explicit

### 4. Security baseline

- Status: drafted
- Artifact: `docs/SECURITY_BASELINE.md`
- Acceptance:
  - current trust boundaries are documented
  - real-upload gates are defined before backend work
  - release and secret-handling constraints are explicit

### 5. Release readiness

- Status: in progress
- Artifacts:
  - `docs/RELEASE_CHECKLIST.md`
  - `docs/RELEASE_PACKET_2026-03-17.md`
- Acceptance:
  - baseline commit or tag exists
  - QA and security evidence are attached
  - rollback target is documented

## Recommended Next Tickets

1. Extract a real `StructureAnalyzer` interface and swap `src/App.tsx` to use it.
2. Add browser smoke coverage for demo load, upload, and export.
3. Add upload validation guardrails and error messaging.
4. Create a committed release-candidate baseline on a `codex/` branch.
5. Design the provider-neutral upload/storage handoff for later service work.
6. Add an explicit warning model for low-confidence or partial analysis results.
