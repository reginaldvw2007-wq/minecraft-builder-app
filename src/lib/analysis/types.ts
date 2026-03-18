import type { BuildPlan, SourceImage } from '../generateBuildPlan'

export type AnalysisMode = 'mock'

export type AnalysisRequest = {
  sources: SourceImage[]
}

export type AnalysisResult = {
  mode: AnalysisMode
  plan: BuildPlan
  warnings: string[]
  sourceCount: number
}

export type StructureAnalyzer = {
  analyze(request: AnalysisRequest): AnalysisResult
}
