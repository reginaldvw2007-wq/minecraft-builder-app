# Minecraft Builder Prototype

This repo now contains the first local prototype for a Minecraft builder app that turns
multiple structure photos into:

- a rough voxel footprint
- inferred dimensions and materials
- a staged Minecraft build guide
- a phone-first Bedrock-style workflow for scouting and building on mobile

The current implementation is intentionally a mock reconstruction engine. It gives us a
working product surface and a replaceable domain boundary before we wire in a real
computer-vision or multimodal pipeline.

## Run locally

```bash
npm install
npm run dev
npm run test
npm run smoke:browser
```

Open the local Vite URL shown in the terminal. The app ships with a demo reference set,
and you can replace it by uploading your own images.

## Live Links

- GitHub repo: [reginaldvw2007-wq/minecraft-builder-app](https://github.com/reginaldvw2007-wq/minecraft-builder-app)
- Public test app: [GitHub Pages preview](https://reginaldvw2007-wq.github.io/minecraft-builder-app/)

## Current scope

- React + TypeScript single-page prototype
- multi-image intake flow
- provider-neutral mock analyzer entrypoint
- upload guardrails for file count, type, and size
- deterministic mock build-plan generation from image metadata
- voxel layer previews and skyline silhouette
- material pack estimates
- JSON and Markdown export for the current build plan
- step-by-step build staging for Minecraft
- unit tests around the generator and export path
- repeatable browser smoke automation for upload and export
- mobile-first UI tuned for narrow screens and sticky hotbar actions
- theme kits grounded in current official Minecraft block families

## Architecture

- [`src/App.tsx`](./src/App.tsx): UI shell, upload flow, layer switching, and build-guide presentation
- [`src/lib/generateBuildPlan.ts`](./src/lib/generateBuildPlan.ts): deterministic mock reconstruction logic and domain types
- [`src/lib/analysis/mockAnalyzer.ts`](./src/lib/analysis/mockAnalyzer.ts): provider-neutral analyzer entrypoint used by the UI
- [`src/lib/validateSources.ts`](./src/lib/validateSources.ts): upload guardrails for image intake
- [`src/App.css`](./src/App.css): prototype-specific component styling
- [`src/index.css`](./src/index.css): global theme, typography, and page atmosphere
- [`docs/MINECRAFT_PRODUCT_NOTES.md`](./docs/MINECRAFT_PRODUCT_NOTES.md): official-source product direction for Bedrock/mobile and current Minecraft block kits

## Recommended next tickets

1. Replace the mock analyzer with a real structure-analysis service that uses image content instead of file metadata.
2. Add richer validation and progress states for long-running or partial analysis results.
3. Add export targets for Minecraft formats such as layer blueprints, schematics, or Litematica-friendly output.
4. Persist projects so users can compare multiple reconstruction attempts and refine a build over time.
