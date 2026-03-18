import { useEffect, useState, useTransition } from 'react'
import './App.css'
import {
  SHOT_ROLE_CYCLE,
  createDemoSources,
  type BuildPlan,
  type LayerSlice,
  type ShotRole,
  type SourceImage,
} from './lib/generateBuildPlan'
import { analyzeStructure } from './lib/analysis/mockAnalyzer'
import type { AnalysisMode } from './lib/analysis/types'
import {
  buildPlanToJson,
  buildPlanToMarkdown,
  createExportBaseName,
} from './lib/exportBuildPlan'
import {
  MAX_REFERENCE_FILE_SIZE_BYTES,
  MAX_REFERENCE_FILES,
  summarizeReferenceValidation,
  validateReferenceFiles,
} from './lib/validateSources'

const INITIAL_SOURCES = createDemoSources()
const INITIAL_ANALYSIS = analyzeStructure({ sources: INITIAL_SOURCES })
const INITIAL_PLAN = INITIAL_ANALYSIS.plan
const UPLOAD_INPUT_ID = 'reference-upload-input'

const FILE_PREVIEW_TONES = [
  'linear-gradient(135deg, #49626d 0%, #d6b17a 100%)',
  'linear-gradient(135deg, #6c5b4d 0%, #9bbf9a 100%)',
  'linear-gradient(135deg, #48556f 0%, #d8d2c3 100%)',
  'linear-gradient(135deg, #31455c 0%, #a6bcc8 100%)',
] as const

const ROLE_NOTES: Record<ShotRole, string> = {
  Front: 'Best for doorway position, facade rhythm, and overall read.',
  Corner: 'Useful for confirming depth and roof direction in one frame.',
  Side: 'Captures repeat windows, annexes, and wall length.',
  Roof: 'Helps estimate pitch, trim, and final silhouette.',
}

function formatBytes(sizeBytes: number) {
  if (sizeBytes >= 1_000_000) {
    return `${(sizeBytes / 1_000_000).toFixed(1)} MB`
  }

  return `${Math.round(sizeBytes / 1_000)} KB`
}

function createSourceFromFile(file: File, index: number): SourceImage {
  const role = SHOT_ROLE_CYCLE[index % SHOT_ROLE_CYCLE.length]

  return {
    id: `${file.name}-${file.lastModified}-${index}`,
    name: file.name,
    sizeBytes: file.size,
    role,
    notes: ROLE_NOTES[role],
    previewTone: FILE_PREVIEW_TONES[index % FILE_PREVIEW_TONES.length],
    previewUrl: URL.createObjectURL(file),
    objectUrl: true,
  }
}

function downloadTextFile(fileName: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.click()

  URL.revokeObjectURL(url)
}

function formatAnalysisMode(mode: AnalysisMode) {
  return mode === 'mock' ? 'Mock analyzer' : mode
}

function App() {
  const [sources, setSources] = useState<SourceImage[]>(INITIAL_SOURCES)
  const [plan, setPlan] = useState<BuildPlan>(INITIAL_PLAN)
  const [activeLayerId, setActiveLayerId] = useState(INITIAL_PLAN.layers[0]?.id ?? '')
  const [analysisWarnings, setAnalysisWarnings] = useState(INITIAL_ANALYSIS.warnings)
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(INITIAL_ANALYSIS.mode)
  const [intakeNotice, setIntakeNotice] = useState('')
  const [exportNotice, setExportNotice] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    return () => {
      for (const source of sources) {
        if (source.objectUrl && source.previewUrl) {
          URL.revokeObjectURL(source.previewUrl)
        }
      }
    }
  }, [sources])

  const activeLayer =
    plan.layers.find((layer) => layer.id === activeLayerId) ?? plan.layers[0]
  const usingDemo = sources.every((source) => source.isDemo)
  const totalReferenceSize = sources.reduce((sum, source) => sum + source.sizeBytes, 0)
  const totalStacks = Math.ceil(plan.totalBlocks / 64)
  const hudCards = [
    {
      label: 'Mode',
      value: 'Bedrock mobile',
      detail: 'Sized for one-thumb browsing, quick scout notes, and touch-friendly follow-through.',
    },
    {
      label: 'Kit',
      value: plan.theme,
      detail: 'Modern Minecraft block family picked for the concept pass.',
    },
    {
      label: 'Stacks',
      value: `${totalStacks}`,
      detail: 'Rough full-stack count before micro detailing.',
    },
  ]
  const profileCards = [
    {
      label: 'Biome fit',
      value: plan.themeProfile.biome,
      detail: plan.themeProfile.vibe,
    },
    {
      label: 'Build lane',
      value: plan.themeProfile.playstyle,
      detail: 'Where this kit feels most natural in a real survival or creative world.',
    },
    {
      label: 'Phone pass',
      value: 'Touch-first build loop',
      detail: plan.themeProfile.mobileHint,
    },
  ]

  function replaceSources(nextSources: SourceImage[]) {
    setSources(nextSources)
    setExportNotice('')

    startTransition(() => {
      const nextAnalysis = analyzeStructure({ sources: nextSources })
      setPlan(nextAnalysis.plan)
      setAnalysisWarnings(nextAnalysis.warnings)
      setAnalysisMode(nextAnalysis.mode)
      setActiveLayerId(nextAnalysis.plan.layers[0]?.id ?? '')
    })
  }

  function handleFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? [])

    if (selectedFiles.length === 0) {
      return
    }

    const validation = validateReferenceFiles(selectedFiles)
    const validationSummary = summarizeReferenceValidation(validation)

    setIntakeNotice(validationSummary)

    if (validation.acceptedFiles.length === 0) {
      event.target.value = ''
      return
    }

    replaceSources(validation.acceptedFiles.map(createSourceFromFile))
    event.target.value = ''
  }

  function loadDemoSet() {
    setIntakeNotice('Restored the demo reference set.')
    replaceSources(createDemoSources())
  }

  function exportJson() {
    const fileName = `${createExportBaseName(plan)}.json`
    downloadTextFile(fileName, buildPlanToJson(plan, sources), 'application/json')
    setExportNotice(`Saved ${fileName}`)
  }

  function exportMarkdown() {
    const fileName = `${createExportBaseName(plan)}.md`
    downloadTextFile(fileName, buildPlanToMarkdown(plan, sources), 'text/markdown')
    setExportNotice(`Saved ${fileName}`)
  }

  return (
    <div className="app-shell">
      <input
        className="shared-upload-input"
        data-testid="reference-upload-input"
        id={UPLOAD_INPUT_ID}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelection}
      />

      <header className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Pocket Build Ticket 001</p>
          <h1>Snap a build. Get the block plan.</h1>
          <p className="hero-summary">
            Built for Bedrock-style builders on phone first: load a few photos, rough in
            the shell, and carry a Minecraft-ready block plan back into your hotbar.
          </p>
          <p className="hero-summary hero-summary--secondary">{plan.summary}</p>
          <p className="hero-note">
            Cherry groves, bamboo mosaics, tuff foundries, pale garden builds, mangrove
            docks, and other modern block kits all feed the visual direction of the mock
            pass.
          </p>

          <div className="hud-strip">
            {hudCards.map((card) => (
              <article key={card.label} className="hud-card">
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <span>{card.detail}</span>
              </article>
            ))}
          </div>

          <div className="kit-tag-row" aria-label="Theme kit tags">
            {plan.themeProfile.tags.map((tag) => (
              <span key={tag} className="kit-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-actions">
          <label className="upload-button" htmlFor={UPLOAD_INPUT_ID}>
            Load reference photos
          </label>
          <p className="status-note">
            Up to {MAX_REFERENCE_FILES} images, {Math.round(MAX_REFERENCE_FILE_SIZE_BYTES / 1_000_000)} MB each.
          </p>
          <button type="button" className="ghost-button" onClick={loadDemoSet}>
            Reset demo set
          </button>
          <div className="secondary-actions">
            <button type="button" className="ghost-button" onClick={exportJson}>
              Export JSON
            </button>
            <button type="button" className="ghost-button" onClick={exportMarkdown}>
              Export guide
            </button>
          </div>
          <p className="status-note" aria-live="polite">
            {isPending
              ? 'Refreshing the reconstruction pass...'
              : usingDemo
                ? 'Demo references are loaded. Add your own photos at any time.'
                : `Using ${sources.length} uploaded photo${sources.length === 1 ? '' : 's'} for the current concept.`}
          </p>
          {intakeNotice ? (
            <p className="status-note status-note--warning" aria-live="polite">
              {intakeNotice}
            </p>
          ) : null}
          {exportNotice ? (
            <p className="status-note status-note--accent" aria-live="polite">
              {exportNotice}
            </p>
          ) : null}
        </div>
      </header>

      <main className="workspace-grid">
        <section className="panel intake-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Scout pack</p>
              <h2>Reference capture</h2>
            </div>
            <p className="section-meta">
              {sources.length} angle{sources.length === 1 ? '' : 's'} •{' '}
              {formatBytes(totalReferenceSize)}
            </p>
          </div>

          <div className="capture-grid">
            {sources.map((source) => (
              <article key={source.id} className="capture-card">
                <div className="capture-preview">
                  {source.previewUrl ? (
                    <img src={source.previewUrl} alt={source.name} />
                  ) : (
                    <div
                      className="capture-swatch"
                      style={{ backgroundImage: source.previewTone }}
                    >
                      <span>{source.role}</span>
                    </div>
                  )}
                </div>
                <div className="capture-body">
                  <div className="capture-line">
                    <span className="capture-role">{source.role}</span>
                    <span className="capture-size">{formatBytes(source.sizeBytes)}</span>
                  </div>
                  <h3>{source.name}</h3>
                  <p>{source.notes}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="pipeline-strip">
            <article className="pipeline-card">
              <p className="pipeline-step">01 Scout</p>
              <strong>Reference alignment</strong>
              <p>Line up facade, side, and roof clues like a fast Bedrock field pass.</p>
            </article>
            <article className="pipeline-card">
              <p className="pipeline-step">02 Mass</p>
              <strong>Silhouette inference</strong>
              <p>Guess the footprint, floor bands, and skyline before counting blocks.</p>
            </article>
            <article className="pipeline-card">
              <p className="pipeline-step">03 Chunk</p>
              <strong>Layer rough-in</strong>
              <p>Turn the mass into chunk-friendly slice maps sized for Minecraft blocks.</p>
            </article>
            <article className="pipeline-card">
              <p className="pipeline-step">04 Craft</p>
              <strong>Build sequence</strong>
              <p>Package material stacks, palette picks, and a phone-friendly build order.</p>
            </article>
          </div>
        </section>

        <section className="panel overview-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Overworld readout</p>
              <h2>Project snapshot</h2>
            </div>
            <div className="chip-row">
              <span className="confidence-chip">{plan.confidence}% confidence</span>
              <span className="confidence-chip confidence-chip--muted">
                {formatAnalysisMode(analysisMode)}
              </span>
            </div>
          </div>

          <div className="metric-grid">
            <article className="metric-card">
              <span className="metric-label">Build ID</span>
              <strong>{plan.structureName}</strong>
              <p>{plan.theme}</p>
            </article>
            <article className="metric-card">
              <span className="metric-label">Footprint</span>
              <strong>
                {plan.dimensions.width} x {plan.dimensions.depth} x {plan.dimensions.height}
              </strong>
              <p>{plan.dimensions.floors} floor bands inferred</p>
            </article>
            <article className="metric-card">
              <span className="metric-label">Hotbar Lead</span>
              <strong>{plan.dominantMaterial}</strong>
              <p>{totalStacks} stacks across {plan.totalBlocks.toLocaleString()} blocks</p>
            </article>
            <article className="metric-card">
              <span className="metric-label">Skyline</span>
              <strong>{plan.roofline}</strong>
              <p>Current concept favors a silhouette that reads cleanly from spawn.</p>
            </article>
          </div>

          <div className="insight-list">
            {plan.insights.map((insight) => (
              <article key={insight.label} className="insight-card">
                <p className="insight-label">{insight.label}</p>
                <strong>{insight.value}</strong>
                <p>{insight.detail}</p>
              </article>
            ))}
          </div>

          <div className="theme-profile-grid">
            {profileCards.map((card) => (
              <article key={card.label} className="theme-profile-card">
                <p className="insight-label">{card.label}</p>
                <strong>{card.value}</strong>
                <p>{card.detail}</p>
              </article>
            ))}
          </div>

          <div className="source-notes">
            <p className="section-kicker">Evidence trail</p>
            <ul>
              {plan.sourceNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>

          <div className="warning-card">
            <p className="section-kicker">Guardrails</p>
            <ul className="warning-list">
              {analysisWarnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="panel layers-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Chunk slices</p>
              <h2>Layer slices and skyline</h2>
            </div>
            <p className="section-meta">
              Rough chunk preview only, tuned for fast iteration before a full generator
            </p>
          </div>

          <div className="layer-tabs" role="tablist" aria-label="Voxel layer slices">
            {plan.layers.map((layer) => (
              <button
                key={layer.id}
                type="button"
                role="tab"
                className={`layer-tab ${layer.id === activeLayer.id ? 'layer-tab--active' : ''}`}
                aria-selected={layer.id === activeLayer.id}
                onClick={() => setActiveLayerId(layer.id)}
              >
                <span>{layer.label}</span>
                <small>{layer.elevation}</small>
              </button>
            ))}
          </div>

          <div className="voxel-layout">
            <div className="skyline-card">
              <div className="skyline-header">
                <div>
                  <p className="section-kicker">Front read</p>
                  <h3>Silhouette profile</h3>
                </div>
                <p>{plan.dimensions.height} block max height</p>
              </div>
              <div className="skyline-chart" aria-label="Estimated front elevation bars">
                {plan.skyline.map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className="skyline-bar"
                    style={{ height: `${(height / (plan.dimensions.height + 2)) * 100}%` }}
                    title={`Column ${index + 1}: ${height} blocks`}
                  />
                ))}
              </div>
            </div>

            <LayerPreview layer={activeLayer} width={plan.dimensions.width} />
          </div>
        </section>

        <section className="panel guide-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Pocket build guide</p>
              <h2>Material pack and step order</h2>
            </div>
            <p className="section-meta">
              Staged for a player who wants a rough but phone-friendly Minecraft build pass
            </p>
          </div>

          <div className="hotbar-panel">
            <p className="section-kicker">Hotbar loadout</p>
            <div className="hotbar-strip">
              {plan.palette.map((material) => (
                <article key={material.block} className={`hotbar-slot tone-${material.tone}`}>
                  <span>{Math.ceil(material.amount / 64)} stacks</span>
                  <strong>{material.block}</strong>
                  <p>{material.purpose}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="material-grid">
            {plan.palette.map((material) => (
              <article key={material.block} className={`material-card tone-${material.tone}`}>
                <p className="material-amount">{material.amount.toLocaleString()} blocks</p>
                <h3>{material.block}</h3>
                <p>{material.purpose}</p>
              </article>
            ))}
          </div>

          <div className="stage-grid">
            {plan.stages.map((stage) => (
              <article key={stage.title} className="stage-card">
                <div className="stage-header">
                  <div>
                    <p className="stage-window">{stage.window}</p>
                    <h3>{stage.title}</h3>
                  </div>
                  <span>{stage.materials}</span>
                </div>
                <p className="stage-goal">{stage.goal}</p>
                <ul className="stage-list">
                  {stage.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="stage-output">Output: {stage.output}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <div className="mobile-hotbar" aria-label="Pocket hotbar actions">
        <label className="mobile-hotbar__slot mobile-hotbar__slot--primary" htmlFor={UPLOAD_INPUT_ID}>
          Upload
        </label>
        <button type="button" className="mobile-hotbar__slot" onClick={loadDemoSet}>
          Demo
        </button>
        <button type="button" className="mobile-hotbar__slot" onClick={exportJson}>
          JSON
        </button>
        <button type="button" className="mobile-hotbar__slot" onClick={exportMarkdown}>
          Guide
        </button>
      </div>
    </div>
  )
}

type LayerPreviewProps = {
  layer: LayerSlice
  width: number
}

function LayerPreview({ layer, width }: LayerPreviewProps) {
  return (
    <div className="slice-card">
      <div className="slice-header">
        <div>
          <p className="section-kicker">{layer.elevation}</p>
          <h3>{layer.label}</h3>
        </div>
        <p>{layer.summary}</p>
      </div>

      <div
        className="layer-grid"
        style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
        aria-label={`${layer.label} slice grid`}
      >
        {layer.grid.flatMap((row, rowIndex) =>
          row.map((cell, columnIndex) => (
            <span
              key={`${rowIndex}-${columnIndex}`}
              className={`layer-cell layer-cell--${cell}`}
            />
          )),
        )}
      </div>

      <div className="layer-legend" aria-hidden="true">
        <span>
          <i className="layer-cell layer-cell--wall" />
          Wall
        </span>
        <span>
          <i className="layer-cell layer-cell--fill" />
          Solid
        </span>
        <span>
          <i className="layer-cell layer-cell--highlight" />
          Accent
        </span>
        <span>
          <i className="layer-cell layer-cell--empty" />
          Open
        </span>
      </div>
    </div>
  )
}

export default App
