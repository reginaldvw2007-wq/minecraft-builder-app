import { describe, expect, it } from 'vitest'
import {
  buildPlanFromSources,
  createDemoSources,
  type SourceImage,
} from './generateBuildPlan'
import {
  buildPlanToJson,
  buildPlanToMarkdown,
  createExportBaseName,
} from './exportBuildPlan'

function createWarehouseSources(): SourceImage[] {
  return [
    {
      id: 'front',
      name: 'warehouse-front.jpg',
      sizeBytes: 2_240_000,
      role: 'Front',
      notes: 'Front facade with loading-door opening.',
      previewTone: 'linear-gradient(135deg, #3c5263 0%, #b8aa87 100%)',
    },
    {
      id: 'corner',
      name: 'warehouse-corner.jpg',
      sizeBytes: 2_880_000,
      role: 'Corner',
      notes: 'Corner angle confirms roof slope and depth.',
      previewTone: 'linear-gradient(135deg, #526e55 0%, #d1c9b7 100%)',
    },
  ]
}

describe('buildPlanFromSources', () => {
  it('creates a stable plan shape from the demo sources', () => {
    const plan = buildPlanFromSources(createDemoSources())

    expect(plan.structureName).toContain('Harbor Workshop')
    expect(plan.layers).toHaveLength(4)
    expect(plan.palette).toHaveLength(5)
    expect(plan.stages).toHaveLength(4)
    expect(plan.dimensions.width).toBeGreaterThanOrEqual(12)
  })

  it('derives a readable structure name from custom source names', () => {
    const plan = buildPlanFromSources(createWarehouseSources())

    expect(plan.structureName).toContain('Warehouse')
    expect(plan.summary).toContain('reference photos')
  })
})

describe('build plan exports', () => {
  it('creates a slugged base file name', () => {
    const plan = buildPlanFromSources(createWarehouseSources())

    expect(createExportBaseName(plan)).toBe('warehouse-concept-build-plan')
  })

  it('serializes a build plan to json and markdown', () => {
    const sources = createWarehouseSources()
    const plan = buildPlanFromSources(sources)
    const generatedAt = '2026-03-17T22:30:00.000Z'

    const json = buildPlanToJson(plan, sources, generatedAt)
    const markdown = buildPlanToMarkdown(plan, sources, generatedAt)

    expect(json).toContain('"exportVersion": 1')
    expect(json).toContain('"mode": "mock-prototype"')
    expect(json).toContain('"structureName": "Warehouse Concept"')
    expect(markdown).toContain('# Warehouse Concept')
    expect(markdown).toContain('## Material Pack')
    expect(markdown).toContain('## Build Stages')
    expect(markdown).toContain('warehouse-front.jpg')
  })
})
