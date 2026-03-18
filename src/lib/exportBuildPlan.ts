import type { BuildPlan, SourceImage } from './generateBuildPlan'

export type BuildPlanExport = {
  exportVersion: 1
  generatedAt: string
  mode: 'mock-prototype'
  structureName: string
  summary: string
  sources: Array<{
    name: string
    role: SourceImage['role']
    sizeBytes: number
    notes: string
  }>
  plan: BuildPlan
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function createExportBaseName(plan: Pick<BuildPlan, 'structureName'>) {
  return `${slugify(plan.structureName)}-build-plan`
}

export function buildPlanToSerializable(
  plan: BuildPlan,
  sources: SourceImage[],
  generatedAt = new Date().toISOString(),
): BuildPlanExport {
  return {
    exportVersion: 1,
    generatedAt,
    mode: 'mock-prototype',
    structureName: plan.structureName,
    summary: plan.summary,
    sources: sources.map((source) => ({
      name: source.name,
      role: source.role,
      sizeBytes: source.sizeBytes,
      notes: source.notes,
    })),
    plan,
  }
}

export function buildPlanToJson(
  plan: BuildPlan,
  sources: SourceImage[],
  generatedAt?: string,
) {
  return JSON.stringify(buildPlanToSerializable(plan, sources, generatedAt), null, 2)
}

export function buildPlanToMarkdown(
  plan: BuildPlan,
  sources: SourceImage[],
  generatedAt = new Date().toISOString(),
) {
  const materialLines = plan.palette
    .map(
      (material) =>
        `- ${material.block}: ${material.amount.toLocaleString()} blocks for ${material.purpose}`,
    )
    .join('\n')

  const stageLines = plan.stages
    .map((stage, index) => {
      const checklist = stage.checklist.map((item) => `  - ${item}`).join('\n')

      return [
        `${index + 1}. ${stage.title} (${stage.window})`,
        `   Goal: ${stage.goal}`,
        `   Materials: ${stage.materials}`,
        `   Output: ${stage.output}`,
        '   Checklist:',
        checklist,
      ].join('\n')
    })
    .join('\n\n')

  const sourceLines = sources
    .map(
      (source) =>
        `- ${source.role}: ${source.name} (${Math.round(source.sizeBytes / 1000)} KB) - ${source.notes}`,
    )
    .join('\n')

  const insightLines = plan.insights
    .map((insight) => `- ${insight.label}: ${insight.value} - ${insight.detail}`)
    .join('\n')

  const sourceNoteLines = plan.sourceNotes.map((note) => `- ${note}`).join('\n')
  const tagLine = plan.themeProfile.tags.join(', ')

  return `# ${plan.structureName}

Generated: ${generatedAt}
Mode: mock-prototype

## Summary

${plan.summary}

## Snapshot

- Theme: ${plan.theme}
- Roofline: ${plan.roofline}
- Confidence: ${plan.confidence}%
- Dominant material: ${plan.dominantMaterial}
- Dimensions: ${plan.dimensions.width} x ${plan.dimensions.depth} x ${plan.dimensions.height}
- Floors inferred: ${plan.dimensions.floors}
- Total blocks: ${plan.totalBlocks.toLocaleString()}

## Reference Photos

${sourceLines}

## Insights

${insightLines}

## Kit Profile

- Biome cue: ${plan.themeProfile.biome}
- Build vibe: ${plan.themeProfile.vibe}
- Playstyle: ${plan.themeProfile.playstyle}
- Mobile hint: ${plan.themeProfile.mobileHint}
- Tags: ${tagLine}

## Material Pack

${materialLines}

## Build Stages

${stageLines}

## Source Notes

${sourceNoteLines}
`
}
