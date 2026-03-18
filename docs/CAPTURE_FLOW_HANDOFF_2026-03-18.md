# Capture Flow Handoff

## Objective

Deliver a phone-first capture flow that feels closer to HOVER-style guided exterior intake:
obvious photo targets, clear progress, automatic rendering once enough photos exist, and a
single tap into the Minecraft build guide.

## Deliverable

- guided 4 to 8 photo intake with slot-based house views
- automatic render state after the first 4 usable photos
- separate render and build-guide stages
- durable workstream split for product UX, implementation, QA, security, and release

## Owner And Handoff Targets

- primary product-flow owner: `App Builder / Experience Owner` (proposed; pending board approval)
- implementation owner: `Builder / Codex Executor`
- analysis contract owner: `Architect / Vision Systems Lead`
- verification owner: `QA / Verification Reviewer`
- upload and vendor risk owner: `Security / Platform Steward`
- preview release owner: `Release Manager`

## Prohibited Actions

- do not add backend storage, auth, or vendor image processing inside this flow ticket
- do not restore dense dashboard copy on the first mobile screen
- do not claim real geometry accuracy while the mock analyzer is still active

## What Changed

- replaced the generic upload dashboard with a slot-based capture loop
- made the camera path one-photo-at-a-time with the back camera preferred on mobile
- auto-started a visible render sequence after 4 photos instead of silently changing data below the fold
- moved the step-by-step guide behind a clear post-render action
- aligned the repo-side Paperclip package with a proposed `App Builder / Experience Owner` role

## What Remains

- decide whether to actually hire the proposed App Builder role in the live Paperclip org
- connect the render step to a real async analysis service
- verify the new capture loop with real house photos on multiple phones

## Risks Or Blockers

- mobile browsers still control the native camera picker, so true persistent camera-session behavior is limited on the web
- the render is still mock-generated from metadata heuristics, not true image understanding
- live Paperclip still needs board approval before the new App Builder role becomes an active agent

## Tests Run

- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run smoke:browser`

## Recommended Next Ticket

Replace the mock render phase with a real photo-analysis service that returns a normalized
structure shell and confidence data for the guided capture slots.
