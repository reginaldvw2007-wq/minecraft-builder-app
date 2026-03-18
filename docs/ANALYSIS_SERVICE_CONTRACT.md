# Analysis Service Contract

## Objective

Define the boundary between the current local prototype and a future image-analysis
service so the UI can evolve without being coupled to one vendor or model stack.

## Current Runtime Boundary

Evidence in the current repo:

- `src/App.tsx` handles photo intake, demo reset, exports, and presentation.
- `src/lib/generateBuildPlan.ts` turns `SourceImage[]` into a deterministic `BuildPlan`.
- `src/lib/analysis/mockAnalyzer.ts` now acts as the provider-neutral analysis entrypoint used by the UI.
- `src/lib/exportBuildPlan.ts` serializes the current plan for handoff.

Current state:

- all processing is local and synchronous
- no network calls exist in the prototype
- structure inference is based on file metadata and naming heuristics, not image content
- upload guardrails currently enforce file count, MIME family, and size before analysis starts

## Proposed Boundary

The UI should depend on a narrow analysis interface rather than directly on the mock
generator.

```ts
type AnalysisRequest = {
  projectId: string
  references: Array<{
    id: string
    name: string
    role: 'Front' | 'Corner' | 'Side' | 'Roof'
    sizeBytes: number
    mimeType?: string
    contentRef: string
    notes?: string
  }>
  options?: {
    targetStyle?: 'rough' | 'detailed'
    maxFootprint?: { width: number; depth: number; height: number }
  }
}

type AnalysisResult = {
  version: 1
  structureName: string
  summary: string
  confidence: number
  theme?: string
  roofline: 'Gabled' | 'Stepped' | 'Parapet' | 'Unknown'
  dimensions: {
    width: number
    depth: number
    height: number
    floors: number
  }
  openings: Array<{
    kind: 'door' | 'window' | 'arch' | 'unknown'
    face: 'front' | 'back' | 'left' | 'right' | 'roof'
    x: number
    y: number
    z?: number
    width: number
    height: number
  }>
  palette: Array<{
    block: string
    amount: number
    purpose: string
    confidence?: number
  }>
  occupancyMap: {
    width: number
    depth: number
    height: number
    layers: Array<{
      id: string
      label: string
      elevation: string
      summary: string
      grid: Array<Array<'empty' | 'wall' | 'fill' | 'highlight'>>
    }>
  }
  skyline: number[]
  buildStages: Array<{
    title: string
    window: string
    goal: string
    checklist: string[]
    output: string
    materials: string
  }>
  warnings: string[]
  evidence: string[]
}
```

## Adapter Shape

Recommended application boundary:

```ts
type StructureAnalyzer = {
  analyze(request: AnalysisRequest): Promise<AnalysisResult>
}
```

Implementation notes:

- keep `BuildPlan` as the app-facing view model
- add a mapper from `AnalysisResult` to `BuildPlan`
- keep the mock implementation behind the same interface for offline development
- keep file upload/storage concerns outside the analyzer contract

## Non-Goals

- no vendor-specific response schema in UI code
- no direct dependency on one model provider from `src/App.tsx`
- no assumption that uploaded files are stored permanently

## Required Guarantees

- missing or weak confidence must surface as warnings, not silent certainty
- dimensions must always be bounded and normalized before display
- occupancy layers must be rectangular and deterministic once returned
- material totals and stage checklists must be derived from the same normalized result

## Recommended Extraction Path

1. Keep `src/lib/analysis/types.ts` as the narrow request/result contract.
2. Preserve `src/lib/analysis/mockAnalyzer.ts` as the offline development implementation.
3. Add `src/lib/analysis/mapResultToBuildPlan.ts` once a richer upstream result exists.
4. Keep `src/App.tsx` calling a single `analyzeStructure()` entrypoint.
5. Add contract tests that run against both the mock analyzer and future service stubs.

## Risks And Assumptions

- the current UI assumes a complete plan arrives in one response
- there is no progress model yet for long-running analysis
- image storage, signed URLs, and provider fan-out are intentionally out of scope

## Recommended Next Tickets

1. Extract the analyzer interface and move the mock generator behind it.
2. Add warnings and partial-result states to the UI.
3. Define a provider-neutral upload handoff for later storage or vendor execution.
