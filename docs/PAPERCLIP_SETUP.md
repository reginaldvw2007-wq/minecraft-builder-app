# Paperclip Setup

## Company

- Name: `Minecraft Builder Ops`
- Company ID: `8ab12575-d59b-4c5c-bee9-c495ddc0930c`
- Issue prefix: `MIN`
- Monthly budget: `2500` cents
- Isolation note: this company is separate from `Eagles Roost Ops`

## Governance Files

Canonical company bootstrap package:

- `/Users/Reggie/Documents/ai-ops/paperclip/companies/minecraft-builder-ops/COMPANY.md`
- `/Users/Reggie/Documents/ai-ops/paperclip/companies/minecraft-builder-ops/paperclip.manifest.json`
- `/Users/Reggie/Documents/ai-ops/paperclip/companies/minecraft-builder-ops/policies/agent-execution-sop.md`
- `/Users/Reggie/Documents/ai-ops/paperclip/companies/minecraft-builder-ops/policies/operating-rules.md`
- `/Users/Reggie/Documents/ai-ops/paperclip/companies/minecraft-builder-ops/policies/security-gates.md`
- `/Users/Reggie/Documents/ai-ops/paperclip/companies/minecraft-builder-ops/projects/phase1-foundation.md`

## Agents

- `CEO / Product Owner` — `6635e56a-0dc0-4ede-9fa9-906c19a3849d`
- `App Builder / Experience Owner` — proposed in repo package; pending board approval before live hire
- `Architect / Vision Systems Lead` — `c0bfb805-5d2a-410c-bd24-59ad299adff4`
- `Builder / Codex Executor` — `57c2bcc8-29e3-476f-b9ba-4102137d68c0`
- `QA / Verification Reviewer` — `59d19c62-4af4-4dc0-a3c0-5f52594365fe`
- `Security / Platform Steward` — `8a4f5cac-f882-43e7-9790-40926962350c`
- `Release Manager` — `f6b4a8ff-ac61-4214-a12f-c305ace9505b`

Budget allocation:

- CEO / Product Owner — `300` cents
- App Builder / Experience Owner — `0` cents until board approval
- Architect / Vision Systems Lead — `450` cents
- Builder / Codex Executor — `900` cents
- QA / Verification Reviewer — `300` cents
- Security / Platform Steward — `350` cents
- Release Manager — `200` cents

## Project

- Name: `Phase 1 Foundation`
- Project route: `/MIN/projects/phase-1-foundation`
- Local workspace: `/Users/Reggie/Documents/New project/mine craft builder app`
- GitHub repo: `https://github.com/reginaldvw2007-wq/minecraft-builder-app`
- Public static preview: `https://reginaldvw2007-wq.github.io/minecraft-builder-app/`

## Starter Issues

- `MIN-1` Build phase 1 backlog and acceptance criteria for the photo-to-voxel MVP
- `MIN-2` Prepare the prototype for a real reconstruction service contract
- `MIN-3` Create the first preview release checklist and rollback expectations
- `MIN-4` Define the analysis boundary for photo intake, reconstruction, and build-guide generation
- `MIN-5` Define verification criteria for voxel output and build-guide quality
- `MIN-6` Threat-model uploads, storage, vendors, and release surfaces for phase 1

## Remaining Follow-Up

- optionally invite an OpenClaw operator later for bounded browser/manual operations
- review the first heartbeat results and adjust budgets if a specific role is too constrained
- decide when to escalate from the current lightweight protection baseline to PR-review requirements
- hire the proposed `App Builder / Experience Owner` role if you want UX/capture orchestration to become a live Paperclip responsibility

## Issue Artifact Map

- `MIN-1` -> `docs/PHASE_1_BACKLOG.md`
- `MIN-2` -> `src/lib/analysis/mockAnalyzer.ts`, `src/lib/validateSources.ts`, `src/lib/exportBuildPlan.ts`, `src/lib/generateBuildPlan.test.ts`, `scripts/browser_smoke.sh`, `docs/ANALYSIS_SERVICE_CONTRACT.md`
- `MIN-3` -> `docs/RELEASE_CHECKLIST.md`, `docs/RELEASE_PACKET_2026-03-17.md`
- `MIN-4` -> `docs/ANALYSIS_SERVICE_CONTRACT.md`
- `MIN-5` -> `docs/VERIFICATION_CRITERIA.md`, `docs/QA_PACKET_2026-03-17.md`
- `MIN-6` -> `docs/SECURITY_BASELINE.md`, `docs/SECURITY_REVIEW_2026-03-17.md`
- `MIN-7` -> `docs/CAPTURE_FLOW_HANDOFF_2026-03-18.md`
