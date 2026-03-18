import { useEffect, useState, useTransition } from 'react'
import './App.css'
import captureQuestMap from './assets/capture-quest-map.svg'
import voxelPocketScene from './assets/voxel-pocket-scene.svg'
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

const PHOTO_MISSIONS = [
  {
    step: '1',
    title: 'Front',
    hint: 'Stand in front of the building and get the whole face.',
  },
  {
    step: '2',
    title: 'Left side',
    hint: 'Walk to the left and grab the full wall.',
  },
  {
    step: '3',
    title: 'Right side',
    hint: 'Walk to the right and grab the full wall.',
  },
  {
    step: '4',
    title: 'Back',
    hint: 'Take one picture straight at the back.',
  },
  {
    step: '5',
    title: 'Roof bonus',
    hint: 'If you can, get a roof shot from higher ground.',
  },
] as const

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
  const quickBuildCards = [
    {
      label: 'Size',
      value: `${plan.dimensions.width} x ${plan.dimensions.depth}`,
      detail: `${plan.dimensions.height} blocks tall`,
    },
    {
      label: 'Main block',
      value: plan.dominantMaterial,
      detail: `${totalStacks} stacks total`,
    },
    {
      label: 'Roof',
      value: plan.roofline,
      detail: plan.theme,
    },
  ]
  const artBadges = [
    plan.themeProfile.tags[0] ?? plan.theme,
    plan.dominantMaterial,
    `${plan.dimensions.width} x ${plan.dimensions.depth}`,
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
          <p className="eyebrow">The Infinity Block</p>
          <h1>Take 4 pics. Build it in Minecraft.</h1>
          <p className="hero-summary">
            Easy for kids: walk around the building, take the pictures below, then tap
            upload.
          </p>
          <p className="hero-summary hero-summary--secondary">
            Best results: front, left side, right side, back. Roof is a bonus.
          </p>
          <p className="hero-note">
            Big buttons first. Full build details lower down when you want them.
          </p>

          <div className="hero-art">
            <div className="hero-art__frame">
              <img
                src={voxelPocketScene}
                alt="Original voxel-style build scene with a tower, tree, chest, and pocket inventory tiles."
              />
              <div className="hero-art__badges">
                {artBadges.map((badge) => (
                  <span key={badge} className="hero-art__badge">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <div className="hero-art__caption">
              <p className="section-kicker">Minecraft vibe</p>
              <p>Original voxel artwork to make the app feel like a real block-building tool.</p>
            </div>
          </div>

          <div className="quest-board">
            <div className="quest-board__header">
              <div>
                <p className="section-kicker">Take these pictures</p>
                <h2>Walk around the building</h2>
              </div>
              <p className="section-meta">4 must-have shots + 1 roof bonus</p>
            </div>
            <div className="quest-map">
              <img
                src={captureQuestMap}
                alt="Simple picture guide showing front, left, right, back, and roof bonus angles around a block house."
              />
            </div>
            <div className="photo-mission-grid">
              {PHOTO_MISSIONS.map((mission) => (
                <article key={mission.step} className="photo-mission-card">
                  <span className="photo-mission-card__number">{mission.step}</span>
                  <strong>{mission.title}</strong>
                  <p>{mission.hint}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-actions">
          <p className="section-kicker">Start here</p>
          <label className="upload-button" htmlFor={UPLOAD_INPUT_ID}>
            Upload My Pictures
          </label>
          <p className="status-note">
            Up to {MAX_REFERENCE_FILES} images. Keep each picture under {Math.round(MAX_REFERENCE_FILE_SIZE_BYTES / 1_000_000)} MB.
          </p>
          <button type="button" className="ghost-button" onClick={loadDemoSet}>
            Try Demo Build
          </button>
          <p className="status-note" aria-live="polite">
            {isPending
              ? 'Building your block guide...'
              : usingDemo
                ? 'Demo pictures are loaded. You can swap them with your own any time.'
                : `Using ${sources.length} uploaded photo${sources.length === 1 ? '' : 's'}.`}
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
          <div className="quick-action-tips">
            <span>Big clear shots</span>
            <span>No zoom</span>
            <span>Whole building in frame</span>
          </div>
        </div>
      </header>

      <main className="workspace-grid">
        <section className="panel intake-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Your pictures</p>
              <h2>Photo bag</h2>
            </div>
            <p className="section-meta">
              {sources.length} photo{sources.length === 1 ? '' : 's'} • {formatBytes(totalReferenceSize)}
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
                  <h3>{source.role} view</h3>
                  <p>{source.notes}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="pipeline-strip">
            <article className="pipeline-card">
              <p className="pipeline-step">01 Upload</p>
              <strong>Take the pictures</strong>
              <p>Use the guide above so the app sees the whole building.</p>
            </article>
            <article className="pipeline-card">
              <p className="pipeline-step">02 Read</p>
              <strong>Check the shape</strong>
              <p>Flip through the layers and make sure the shell looks right.</p>
            </article>
            <article className="pipeline-card">
              <p className="pipeline-step">03 Build</p>
              <strong>Start building</strong>
              <p>Use the block list and step cards when you jump into Minecraft.</p>
            </article>
          </div>
        </section>

        <section className="panel overview-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Quick build</p>
              <h2>What to build</h2>
            </div>
            <div className="chip-row">
              <span className="confidence-chip">{plan.confidence}% confidence</span>
              <span className="confidence-chip confidence-chip--muted">
                {formatAnalysisMode(analysisMode)}
              </span>
            </div>
          </div>

          <p className="quick-build-summary">{plan.summary}</p>

          <div className="metric-grid">
            {quickBuildCards.map((card) => (
              <article key={card.label} className="metric-card">
                <span className="metric-label">{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.detail}</p>
              </article>
            ))}
          </div>

          <details className="details-drawer">
            <summary>More build details</summary>
            <div className="details-drawer__content">
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
                <article className="theme-profile-card">
                  <p className="insight-label">Biome fit</p>
                  <strong>{plan.themeProfile.biome}</strong>
                  <p>{plan.themeProfile.vibe}</p>
                </article>
                <article className="theme-profile-card">
                  <p className="insight-label">Build lane</p>
                  <strong>{plan.themeProfile.playstyle}</strong>
                  <p>Where this style fits best in a Minecraft world.</p>
                </article>
                <article className="theme-profile-card">
                  <p className="insight-label">Phone hint</p>
                  <strong>Build in passes</strong>
                  <p>{plan.themeProfile.mobileHint}</p>
                </article>
              </div>

              <div className="source-notes">
                <p className="section-kicker">Why it guessed this</p>
                <ul>
                  {plan.sourceNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>

              <div className="warning-card">
                <p className="section-kicker">Prototype note</p>
                <ul className="warning-list">
                  {analysisWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        </section>

        <section className="panel layers-panel">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Build shape</p>
              <h2>Layers and skyline</h2>
            </div>
            <p className="section-meta">
              Tap a layer to see the shell before you start building.
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
              <p className="section-kicker">Build guide</p>
              <h2>Blocks and steps</h2>
            </div>
            <div className="secondary-actions">
              <button type="button" className="ghost-button" onClick={exportJson}>
                Export JSON
              </button>
              <button type="button" className="ghost-button" onClick={exportMarkdown}>
                Export guide
              </button>
            </div>
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
