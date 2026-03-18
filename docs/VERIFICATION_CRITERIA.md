# Verification Criteria

## Goal

Provide a repeatable checklist for deciding whether the prototype output is useful,
non-misleading, and safe to share as a rough preview.

## Current Product Limits

- the generator is mock logic only
- no image understanding is performed yet
- results should be described as concept output, not geometry-accurate reconstruction

## Automated Regression Baseline

Required on every meaningful change:

- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run smoke:browser`

Minimum pass condition:

- generator tests pass
- export tests pass
- no lint errors
- production build succeeds

## Output Review Criteria

### 1. Footprint reasonableness

- width, depth, and height remain within bounded prototype limits
- inferred floors align with total height
- skyline bars do not exceed the stated height budget by more than the documented cap

### 2. Material credibility

- dominant material matches the named theme
- block totals are non-zero and internally consistent with structure scale
- material purposes read like build guidance, not random labels

### 3. Layer readability

- every generated layer has a label, elevation, and summary
- grid dimensions match the displayed footprint
- door or opening space remains visible in the lower-shell layer
- legend colors remain distinguishable on desktop and mobile

### 4. Build-guide clarity

- each stage has a clear goal, materials, output, and checklist
- stage order moves from pad -> shell -> upper band -> roof/detail
- no checklist item claims exact accuracy beyond the mock system's capability

### 5. Export completeness

- JSON export includes sources, summary, plan metadata, and the full layer/stage payload
- Markdown export includes snapshot, references, insights, materials, and stages
- exported file names are stable and derived from the structure name

## Manual Smoke Pass

Run before any preview handoff:

1. Load the demo set and confirm the summary, layers, materials, and stages render.
2. Upload at least two images and confirm the plan changes.
3. Export JSON and Markdown and confirm both files download successfully.
4. Confirm the status message reflects the current source set or export result.
5. Refresh the page and verify the app still boots cleanly.

Current automation support:

- `npm run smoke:browser` covers the demo load plus export path
- custom upload coverage still needs a browser automation pass

## Failure Conditions

Block preview if any of the following occur:

- blank layer panel or broken stage list
- export buttons fail silently
- plan dimensions or totals render as `NaN` or empty values
- UI language suggests the result is image-accurate when it is not

## Recommended Follow-Up

- add browser-level smoke coverage for upload + export
- add golden test fixtures for future non-mock analysis output
