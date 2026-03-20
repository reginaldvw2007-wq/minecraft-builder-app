import {
  buildPlanFromSources,
  createDemoSources,
  type SourceImage,
} from '../generateBuildPlan'
import { MIN_RECOMMENDED_REFERENCE_COUNT } from '../validateSources'
import type { AnalysisRequest, AnalysisResult, StructureAnalyzer } from './types'

function collectWarnings(sources: SourceImage[]) {
  const hasCaptureProfiles = sources.some((source) => source.captureProfile)
  const warnings = [
    hasCaptureProfiles
      ? 'Prototype output uses local photo color and silhouette heuristics, not full 3D image understanding.'
      : 'Prototype output is mock-generated from file names and sizes, not real image understanding.',
  ]

  if (sources.length < MIN_RECOMMENDED_REFERENCE_COUNT) {
    warnings.push(
      `Use at least ${MIN_RECOMMENDED_REFERENCE_COUNT} angles for a more believable concept pass.`,
    )
  }

  if (!sources.some((source) => source.role === 'Roof')) {
    warnings.push('No roof angle was provided, so roofline confidence is weaker than the rest of the structure.')
  }

  if (sources.every((source) => source.isDemo)) {
    warnings.push('Demo references are active. Upload your own photos before treating this as a project-specific concept.')
  }

  return warnings
}

export const mockStructureAnalyzer: StructureAnalyzer = {
  analyze(request: AnalysisRequest): AnalysisResult {
    const sources = request.sources.length > 0 ? request.sources : createDemoSources()

    return {
      mode: 'mock',
      plan: buildPlanFromSources(sources),
      warnings: collectWarnings(sources),
      sourceCount: sources.length,
    }
  },
}

export function analyzeStructure(
  request: AnalysisRequest,
  analyzer: StructureAnalyzer = mockStructureAnalyzer,
) {
  return analyzer.analyze(request)
}
