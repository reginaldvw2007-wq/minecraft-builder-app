# Security Baseline

## Scope

This baseline covers the current local prototype and the minimum controls required
before the project introduces real user photos, external model vendors, storage, or a
shared preview environment.

## Current Repo Grounding

Evidence anchors:

- `src/App.tsx` accepts local image files and renders previews in-browser.
- `src/lib/generateBuildPlan.ts` produces deterministic mock output without network calls.
- `src/lib/exportBuildPlan.ts` writes JSON and Markdown artifacts to the user's machine.

Current posture:

- client-only application
- no backend, auth, analytics, or persistent storage
- uploaded files stay in browser memory via object URLs during the current session
- exports are explicitly user-initiated downloads

## Current Sensitive Assets

- local reference photos loaded into browser memory
- exported build guides saved to disk by the operator
- source code and build artifacts
- Paperclip company configuration and issue data outside this repo

## Current Trust Boundaries

1. Local operator -> browser file input
   - untrusted input enters through `input type="file"`
2. Browser memory -> local rendering/export pipeline
   - image previews and derived plan data are displayed and serialized
3. Local repo -> Paperclip governance
   - organizational decisions and release gates live outside the runtime code

## Present-Day Risk Notes

- there is no server-side upload surface yet, which removes many current remote risks
- the main active risk is misleading operators into believing the output is image-accurate
- large or malformed images could still stress the local browser session

## Required Controls Before Real Upload Or Vendor Work

### Upload Handling

- enforce file count, file size, and MIME allow-lists before analysis starts
- display clear copy that photos may contain metadata and sensitive details
- reject unsupported formats with user-facing errors, not silent fallback

### Storage And Retention

- do not persist photos by default without an explicit retention policy
- if storage is introduced, isolate raw uploads from derived plan artifacts
- use signed URLs or scoped object access rather than broad bucket credentials

### Vendor And Model Usage

- require explicit configuration for any third-party model provider
- document whether photos leave the local machine and obtain user consent first
- strip or minimize unnecessary metadata before provider submission when possible

### Secrets And Auth

- keep provider keys server-side only once backend work begins
- do not embed secrets in the frontend bundle or Paperclip issue text
- require authenticated project ownership before multi-user storage or sharing exists

### Release And Oversight

- keep a no-go default for public previews until QA and security artifacts are attached
- require a committed rollback target before any shared deployment
- keep Paperclip approvals for releases that involve user uploads or external vendors

## Phase 1 Gates

The following must be true before any real-photo service integration:

1. Analyzer boundary is extracted from the UI.
2. Upload validation and error states exist.
3. Release checklist and verification criteria are attached.
4. Secret handling path is defined outside the frontend.
5. A fresh review covers vendor data flow and retention choices.

## Recommended Next Security Tickets

1. Add client-side guardrails for file count, MIME type, and oversized uploads.
2. Write a provider data-flow review before any external model call is implemented.
3. Define a minimal auth and storage policy before shared project persistence.
