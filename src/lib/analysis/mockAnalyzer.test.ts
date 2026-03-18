import { describe, expect, it } from 'vitest'
import { createDemoSources, type SourceImage } from '../generateBuildPlan'
import { analyzeStructure } from './mockAnalyzer'

function createTwoAngleSources(): SourceImage[] {
  return [
    {
      id: 'front',
      name: 'warehouse-front.jpg',
      sizeBytes: 2_200_000,
      role: 'Front',
      notes: 'Main facade.',
      previewTone: 'linear-gradient(135deg, #3c5263 0%, #b8aa87 100%)',
    },
    {
      id: 'corner',
      name: 'warehouse-corner.jpg',
      sizeBytes: 2_600_000,
      role: 'Corner',
      notes: 'Corner depth read.',
      previewTone: 'linear-gradient(135deg, #526e55 0%, #d1c9b7 100%)',
    },
  ]
}

describe('analyzeStructure', () => {
  it('returns a wrapped plan with mock analysis metadata', () => {
    const result = analyzeStructure({ sources: createDemoSources() })

    expect(result.mode).toBe('mock')
    expect(result.sourceCount).toBe(4)
    expect(result.plan.structureName).toContain('Harbor Workshop')
    expect(result.warnings[0]).toContain('mock-generated')
  })

  it('adds coverage warnings for limited source sets', () => {
    const result = analyzeStructure({ sources: createTwoAngleSources() })

    expect(result.warnings.some((warning) => warning.includes('at least 3 angles'))).toBe(
      true,
    )
    expect(result.warnings.some((warning) => warning.includes('No roof angle'))).toBe(true)
  })
})
