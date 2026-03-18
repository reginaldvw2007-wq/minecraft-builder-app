# Handoff Notes

## Objective

Create a first working local prototype for the Minecraft builder app so the team can
interact with the intended flow before integrating a real photo-analysis backend.

## What changed

- scaffolded a React + TypeScript + Vite app in this project folder
- replaced the starter template with a custom prototype for:
  - multi-photo intake
  - mock reconstruction summary
  - voxel layer preview
  - material estimation
  - staged Minecraft build instructions
- added export artifacts for JSON and Markdown build-plan handoff
- added unit coverage for generator and export behavior
- extracted a provider-neutral mock analyzer entrypoint for the UI
- added upload validation guardrails and repeatable browser smoke automation
- tightened the browser smoke to prove a phone-sized viewport and sticky mobile hotbar actions
- added repo-local operations packets for architecture, QA, security, backlog, and release
- created a public GitHub repo and static GitHub Pages preview for testing
- switched GitHub Pages to workflow publishing and protected the working branch with required `CI`, no force-pushes, and no branch deletion
- added official-source Minecraft product notes to keep the theme direction grounded in modern Bedrock block families
- isolated the reconstruction logic in `src/lib/generateBuildPlan.ts` so it can be
  swapped for a real analysis pipeline later without rewriting the UI shell

## What remains

- connect the app to a real photo-understanding pipeline
- use actual image geometry or segmentation instead of filename and file-size heuristics
- support saving projects and generating richer voxel outputs
- add broader browser smoke coverage for upload failures, long analysis states, and export variants
- convert the analyzer boundary from synchronous local mock execution to a service-ready async path
- decide when to add PR review requirements on top of the current lightweight branch protection baseline

## Risks and blockers

- current reconstruction output is illustrative only and should not be treated as
  geometry-accurate
- uploaded images are previewed locally in-browser but not persisted
- no backend or storage layer exists yet

## Tests run

- `npm install`
- `npm run test`
- `npm run build`
- `npm run lint`
- `npm run smoke:browser`

## External Links

- GitHub repo: `https://github.com/reginaldvw2007-wq/minecraft-builder-app`
- Public test app: `https://reginaldvw2007-wq.github.io/minecraft-builder-app/`

## Recommended next ticket

Implement a real analysis boundary behind `buildPlanFromSources`, returning normalized
dimensions, roof type, detected openings, and a voxel occupancy map from the actual
reference images.
