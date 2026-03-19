import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type ChangeEvent,
} from 'react'
import './App.css'
import builderBadgeStrip from './assets/builder-badge-strip.svg'
import captureQuestMap from './assets/capture-quest-map.svg'
import revealCelebrationCard from './assets/reveal-celebration-card.svg'
import voxelPocketScene from './assets/voxel-pocket-scene.svg'
import {
  createDemoSources,
  type BuildPlan,
  type LayerCell,
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
  MAX_REFERENCE_FILES,
  summarizeReferenceValidation,
  validateReferenceFiles,
} from './lib/validateSources'

const INITIAL_ANALYSIS = analyzeStructure({ sources: createDemoSources() })
const INITIAL_PLAN = INITIAL_ANALYSIS.plan
const CAMERA_INPUT_ID = 'camera-capture-input'
const LIBRARY_INPUT_ID = 'library-upload-input'
const MIN_RENDER_PHOTO_COUNT = 4
const RENDER_STEPS = [
  'Uploading photos',
  'Reading the house shape',
  'Placing the block shell',
  'Writing the guide',
] as const

const PHOTO_MISSIONS = [
  {
    id: 'front',
    step: '1',
    title: 'Front',
    hint: 'Stand back and fit the whole front wall in the frame.',
    role: 'Front',
  },
  {
    id: 'front-left-corner',
    step: '2',
    title: 'Front-left corner',
    hint: 'Catch the front and left side together from the corner.',
    role: 'Corner',
  },
  {
    id: 'left-side',
    step: '3',
    title: 'Left side',
    hint: 'Aim straight at the left wall and keep the full side visible.',
    role: 'Side',
  },
  {
    id: 'back-left-corner',
    step: '4',
    title: 'Back-left corner',
    hint: 'Grab the back edge and left wall in one corner shot.',
    role: 'Corner',
  },
  {
    id: 'back',
    step: '5',
    title: 'Back',
    hint: 'Stand behind the building and frame the full back.',
    role: 'Front',
  },
  {
    id: 'back-right-corner',
    step: '6',
    title: 'Back-right corner',
    hint: 'Catch the back and right side together from the corner.',
    role: 'Corner',
  },
  {
    id: 'right-side',
    step: '7',
    title: 'Right side',
    hint: 'Aim straight at the right wall and keep the whole side visible.',
    role: 'Side',
  },
  {
    id: 'front-right-corner',
    step: '8',
    title: 'Front-right corner',
    hint: 'Finish the loop with the front and right wall together.',
    role: 'Corner',
  },
] as const satisfies ReadonlyArray<{
  id: string
  step: string
  title: string
  hint: string
  role: ShotRole
}>

const FILE_PREVIEW_TONES = [
  'linear-gradient(135deg, #49626d 0%, #d6b17a 100%)',
  'linear-gradient(135deg, #6c5b4d 0%, #9bbf9a 100%)',
  'linear-gradient(135deg, #48556f 0%, #d8d2c3 100%)',
  'linear-gradient(135deg, #31455c 0%, #a6bcc8 100%)',
] as const

type SlotSource = SourceImage | null
type AppView = 'capture' | 'render' | 'guide'
type RenderState = 'idle' | 'rendering' | 'ready'
type SliceRotation = 'front' | 'right' | 'back' | 'left'

const SLICE_ROTATIONS: SliceRotation[] = ['front', 'right', 'back', 'left']
const SLICE_ROTATION_LABELS: Record<SliceRotation, string> = {
  front: 'Front',
  right: 'Right',
  back: 'Back',
  left: 'Left',
}

function createEmptySlotSources(): SlotSource[] {
  return PHOTO_MISSIONS.map(() => null)
}

function formatBytes(sizeBytes: number) {
  if (sizeBytes >= 1_000_000) {
    return `${(sizeBytes / 1_000_000).toFixed(1)} MB`
  }

  return `${Math.round(sizeBytes / 1_000)} KB`
}

function createSourceFromFile(file: File, slotIndex: number): SourceImage {
  const mission = PHOTO_MISSIONS[slotIndex]
  const role = mission?.role ?? 'Corner'

  return {
    id: `${mission?.id ?? 'slot'}-${file.name}-${file.lastModified}-${slotIndex}`,
    name: file.name || `${mission?.title ?? 'house-photo'}.jpg`,
    sizeBytes: file.size,
    role,
    notes: mission?.hint ?? 'House photo captured for the block render.',
    previewTone: FILE_PREVIEW_TONES[slotIndex % FILE_PREVIEW_TONES.length],
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

function getNextOpenSlotIndex(slotSources: SlotSource[]) {
  return slotSources.findIndex((source) => source === null)
}

function getOrderedSources(slotSources: SlotSource[]) {
  return slotSources.filter((source): source is SourceImage => source !== null)
}

function buildDemoSlotSources() {
  const nextSlots = createEmptySlotSources()

  for (const [index, source] of createDemoSources().entries()) {
    nextSlots[index] = source
  }

  return nextSlots
}

function rotateClockwise(grid: LayerCell[][]) {
  const rowCount = grid.length
  const columnCount = grid[0]?.length ?? 0

  return Array.from({ length: columnCount }, (_, rowIndex) =>
    Array.from({ length: rowCount }, (_, columnIndex) => grid[rowCount - 1 - columnIndex][rowIndex]),
  )
}

function rotateLayerGrid(grid: LayerCell[][], rotation: SliceRotation) {
  if (rotation === 'front') {
    return grid
  }

  const firstTurn = rotateClockwise(grid)

  if (rotation === 'right') {
    return firstTurn
  }

  const secondTurn = rotateClockwise(firstTurn)

  if (rotation === 'back') {
    return secondTurn
  }

  return rotateClockwise(secondTurn)
}

function summarizeLayer(layer: LayerSlice) {
  let wallCount = 0
  let fillCount = 0
  let highlightCount = 0

  for (const row of layer.grid) {
    for (const cell of row) {
      if (cell === 'wall') {
        wallCount += 1
      } else if (cell === 'fill') {
        fillCount += 1
      } else if (cell === 'highlight') {
        highlightCount += 1
      }
    }
  }

  const totalBlocks = wallCount + fillCount + highlightCount
  const checklist = [
    wallCount > 0 ? `Place ${wallCount} wall blocks first to lock the outline.` : null,
    fillCount > 0 ? `Fill in ${fillCount} center blocks after the outline is stable.` : null,
    highlightCount > 0 ? `Add ${highlightCount} accent blocks last for trims and openings.` : null,
  ].filter(Boolean) as string[]

  return {
    wallCount,
    fillCount,
    highlightCount,
    totalBlocks,
    checklist,
    footprint: `${layer.grid[0]?.length ?? 0} x ${layer.grid.length}`,
  }
}

function getBuilderReward(photoCount: number) {
  if (photoCount >= 8) {
    return {
      title: 'Legendary Scanner',
      detail: 'All eight house angles locked in. This is the best kind of reveal.',
    }
  }

  if (photoCount >= 6) {
    return {
      title: 'Build Hero',
      detail: 'Bonus corner shots make the block shape feel stronger and more magical.',
    }
  }

  if (photoCount >= 4) {
    return {
      title: 'Block Finder',
      detail: 'You unlocked the Minecraft build reveal. Time to see the block shell.',
    }
  }

  return {
    title: 'Photo Scout',
    detail: `${Math.max(MIN_RENDER_PHOTO_COUNT - photoCount, 0)} more photo${photoCount === 3 ? '' : 's'} to unlock the reveal.`,
  }
}

function App() {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)
  const renderTimersRef = useRef<number[]>([])

  const [slotSources, setSlotSources] = useState<SlotSource[]>(createEmptySlotSources)
  const [plan, setPlan] = useState<BuildPlan>(INITIAL_PLAN)
  const [activeLayerId, setActiveLayerId] = useState(INITIAL_PLAN.layers[0]?.id ?? '')
  const [analysisWarnings, setAnalysisWarnings] = useState<string[]>([])
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(INITIAL_ANALYSIS.mode)
  const [view, setView] = useState<AppView>('capture')
  const [renderState, setRenderState] = useState<RenderState>('idle')
  const [renderStepIndex, setRenderStepIndex] = useState(0)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)
  const [guideRotation, setGuideRotation] = useState<SliceRotation>('front')
  const [intakeNotice, setIntakeNotice] = useState('')
  const [exportNotice, setExportNotice] = useState('')
  const [isPending, startTransition] = useTransition()

  const sources = getOrderedSources(slotSources)
  const nextOpenSlotIndex = getNextOpenSlotIndex(slotSources)
  const activeSlotIndex =
    selectedSlotIndex ?? (nextOpenSlotIndex === -1 ? PHOTO_MISSIONS.length - 1 : nextOpenSlotIndex)
  const activeMission = PHOTO_MISSIONS[activeSlotIndex]
  const activeLayer =
    plan.layers.find((layer) => layer.id === activeLayerId) ?? plan.layers[0]
  const activeLayerIndex = Math.max(
    plan.layers.findIndex((layer) => layer.id === activeLayer.id),
    0,
  )
  const usingDemo = sources.length > 0 && sources.every((source) => source.isDemo)
  const totalReferenceSize = sources.reduce((sum, source) => sum + source.sizeBytes, 0)
  const totalStacks = Math.ceil(plan.totalBlocks / 64)
  const canRender = sources.length >= MIN_RENDER_PHOTO_COUNT
  const builderReward = getBuilderReward(sources.length)
  const activeLayerSummary = summarizeLayer(activeLayer)
  const revealBadges = [
    builderReward.title,
    plan.themeProfile.tags[0] ?? plan.theme,
    `${plan.stages.length} build stages`,
  ]
  const quickBuildCards = [
    {
      label: 'Size',
      value: `${plan.dimensions.width} x ${plan.dimensions.depth}`,
      detail: `${plan.dimensions.height} blocks tall`,
    },
    {
      label: 'Main block',
      value: plan.dominantMaterial,
      detail: `${totalStacks} stacks`,
    },
    {
      label: 'Roof',
      value: plan.roofline,
      detail: `${plan.confidence}% confidence`,
    },
  ]

  useEffect(() => {
    return () => {
      for (const source of sources) {
        if (source.objectUrl && source.previewUrl) {
          URL.revokeObjectURL(source.previewUrl)
        }
      }
    }
  }, [sources])

  useEffect(() => {
    return () => {
      for (const timer of renderTimersRef.current) {
        window.clearTimeout(timer)
      }
      renderTimersRef.current = []
    }
  }, [])

  function runRender(nextSources: SourceImage[]) {
    for (const timer of renderTimersRef.current) {
      window.clearTimeout(timer)
    }
    renderTimersRef.current = []

    if (nextSources.length < MIN_RENDER_PHOTO_COUNT) {
      setRenderState('idle')
      setRenderStepIndex(0)
      setView('capture')
      return
    }

    setView('render')
    setRenderState('rendering')
    setRenderStepIndex(0)

    const stepTimers = RENDER_STEPS.slice(1).map((_, index) =>
      window.setTimeout(() => {
        setRenderStepIndex(index + 1)
      }, (index + 1) * 320),
    )

    const finalizeTimer = window.setTimeout(() => {
      startTransition(() => {
        const nextAnalysis = analyzeStructure({ sources: nextSources })
        setPlan(nextAnalysis.plan)
        setAnalysisWarnings(nextAnalysis.warnings)
        setAnalysisMode(nextAnalysis.mode)
        setActiveLayerId(nextAnalysis.plan.layers[0]?.id ?? '')
        setRenderState('ready')
      })
    }, 1280)

    renderTimersRef.current = [...stepTimers, finalizeTimer]
  }

  function openCamera() {
    cameraInputRef.current?.click()
  }

  function openLibrary() {
    libraryInputRef.current?.click()
  }

  function clearSession() {
    setSlotSources(createEmptySlotSources())
    setSelectedSlotIndex(null)
    setView('capture')
    setRenderState('idle')
    setRenderStepIndex(0)
    setIntakeNotice('')
    setExportNotice('')
  }

  function handleCameraCapture(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      return
    }

    const validation = validateReferenceFiles([selectedFile])
    const validationSummary = summarizeReferenceValidation(validation)

    if (validation.acceptedFiles.length === 0) {
      setIntakeNotice(validationSummary)
      event.target.value = ''
      return
    }

    const nextSlots =
      usingDemo && sources.length > 0 ? createEmptySlotSources() : [...slotSources]
    const existingSource = nextSlots[activeSlotIndex]

    if (existingSource?.objectUrl && existingSource.previewUrl) {
      URL.revokeObjectURL(existingSource.previewUrl)
    }

    nextSlots[activeSlotIndex] = createSourceFromFile(validation.acceptedFiles[0], activeSlotIndex)

    const nextSources = getOrderedSources(nextSlots)

    setSlotSources(nextSlots)
    setSelectedSlotIndex(
      getNextOpenSlotIndex(nextSlots) === -1 ? null : getNextOpenSlotIndex(nextSlots),
    )
    runRender(nextSources)
    setIntakeNotice(validationSummary || `${activeMission.title} captured.`)
    setExportNotice('')
    event.target.value = ''
  }

  function handleLibrarySelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? [])

    if (selectedFiles.length === 0) {
      return
    }

    const validation = validateReferenceFiles(selectedFiles)
    const validationSummary = summarizeReferenceValidation(validation)
    const baseSlots =
      usingDemo && sources.length > 0 ? createEmptySlotSources() : [...slotSources]
    const openSlotIndexes = baseSlots
      .map((slotSource, index) => (slotSource === null ? index : -1))
      .filter((index) => index >= 0)
    const acceptedFiles = validation.acceptedFiles.slice(0, openSlotIndexes.length)
    const noticeParts = validationSummary ? [validationSummary] : []

    if (validation.acceptedFiles.length > openSlotIndexes.length) {
      noticeParts.push(`Only ${MAX_REFERENCE_FILES} photos fit in one render.`)
    }

    if (acceptedFiles.length === 0) {
      setIntakeNotice(noticeParts.join(' '))
      event.target.value = ''
      return
    }

    const nextSlots = [...baseSlots]

    acceptedFiles.forEach((file, index) => {
      const slotIndex = openSlotIndexes[index]
      nextSlots[slotIndex] = createSourceFromFile(file, slotIndex)
    })

    const nextSources = getOrderedSources(nextSlots)

    setSlotSources(nextSlots)
    setSelectedSlotIndex(
      getNextOpenSlotIndex(nextSlots) === -1 ? null : getNextOpenSlotIndex(nextSlots),
    )
    runRender(nextSources)
    setIntakeNotice(
      noticeParts.join(' ') || `Added ${acceptedFiles.length} house photo${acceptedFiles.length === 1 ? '' : 's'}.`,
    )
    setExportNotice('')
    event.target.value = ''
  }

  function loadDemoSet() {
    const nextSlots = buildDemoSlotSources()
    const nextSources = getOrderedSources(nextSlots)

    setSlotSources(nextSlots)
    setSelectedSlotIndex(null)
    setIntakeNotice('Demo house loaded.')
    setExportNotice('')
    runRender(nextSources)
  }

  function stepActiveLayer(direction: -1 | 1) {
    const nextIndex = activeLayerIndex + direction
    const nextLayer = plan.layers[nextIndex]

    if (nextLayer) {
      setActiveLayerId(nextLayer.id)
    }
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
        ref={cameraInputRef}
        className="shared-upload-input"
        data-testid="camera-capture-input"
        id={CAMERA_INPUT_ID}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
      />
      <input
        ref={libraryInputRef}
        className="shared-upload-input"
        data-testid="library-upload-input"
        id={LIBRARY_INPUT_ID}
        type="file"
        accept="image/*"
        multiple
        onChange={handleLibrarySelection}
      />

      <header className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Mobile Minecraft Builder</p>
          <div className="brand-lockup">
            <h1 className="brand-title">
              <span>The Infinity</span>
              <span>Block</span>
            </h1>
            <p className="brand-tagline">kids yearn foir the mines</p>
          </div>
          <p className="hero-summary">Take 4 to 8 house photos. We turn them into blocks.</p>
          <div className="hero-pill-row" aria-label="App promises">
            <span>Scan it</span>
            <span>Reveal it</span>
            <span>Build it</span>
          </div>
        </div>

        <div className="hero-art">
          <div className="hero-art__frame">
            <img
              src={voxelPocketScene}
              alt="Original voxel-style build scene with a tower, tree, chest, and block inventory."
            />
          </div>
          <p className="hero-art__caption">Minecraft-style art. Simple buttons. Fast build plan.</p>
        </div>
      </header>

      <nav className="mode-switch" aria-label="Builder steps">
        <button
          type="button"
          className={`mode-switch__button ${view === 'capture' ? 'mode-switch__button--active' : ''}`}
          onClick={() => setView('capture')}
        >
          1. Take Photos
        </button>
        <button
          type="button"
          className={`mode-switch__button ${view === 'render' ? 'mode-switch__button--active' : ''}`}
          onClick={() => setView('render')}
          disabled={!canRender}
        >
          2. Auto Render
        </button>
        <button
          type="button"
          className={`mode-switch__button ${view === 'guide' ? 'mode-switch__button--active' : ''}`}
          onClick={() => setView('guide')}
          disabled={renderState !== 'ready'}
        >
          3. Build Guide
        </button>
      </nav>

      {view === 'capture' ? (
        <section className="panel screen-panel capture-screen">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Step 1</p>
              <h2>Walk around the house</h2>
            </div>
            <p className="progress-chip">
              {sources.length} / {PHOTO_MISSIONS.length} photos
            </p>
          </div>

          <div className="capture-hero-card">
            <div className="capture-hero-card__copy">
              <p className="section-kicker">{canRender ? 'Render unlocked' : 'Next photo'}</p>
              <h3>{activeMission.title}</h3>
              <p>{activeMission.hint}</p>
              <div className="capture-status-row">
                <span>{Math.max(MIN_RENDER_PHOTO_COUNT - sources.length, 0)} left to unlock reveal</span>
                <span>{Math.max(PHOTO_MISSIONS.length - sources.length, 0)} open slots</span>
              </div>
            </div>

            <div className="capture-action-stack">
              <button type="button" className="upload-button upload-button--xl" onClick={openCamera}>
                {slotSources[activeSlotIndex] ? `Retake ${activeMission.title}` : `Take ${activeMission.title}`}
              </button>
              <button type="button" className="ghost-button" onClick={openLibrary}>
                Upload from library
              </button>
              <button type="button" className="ghost-button" onClick={loadDemoSet}>
                Try demo house
              </button>
              {sources.length > 0 ? (
                <button type="button" className="ghost-button ghost-button--quiet" onClick={clearSession}>
                  Start over
                </button>
              ) : null}
            </div>
          </div>

          <div className="reward-strip-card">
            <img
              src={builderBadgeStrip}
              alt="Blocky builder badge strip showing progress toward the reveal."
            />
            <div className="reward-strip-card__copy">
              <p className="section-kicker">Builder badge</p>
              <h3>{builderReward.title}</h3>
              <p>{builderReward.detail}</p>
            </div>
          </div>

          <div className="quest-map-card">
            <img
              src={captureQuestMap}
              alt="Simple house photo route showing front, corners, and side shots around a block building."
            />
          </div>

          <div className="mission-grid" aria-label="House photo slots">
            {PHOTO_MISSIONS.map((mission, index) => {
              const slotSource = slotSources[index]
              const missionState = slotSource
                ? 'done'
                : index === activeSlotIndex
                  ? 'active'
                  : 'waiting'

              return (
                <button
                  key={mission.id}
                  type="button"
                  className={`mission-card mission-card--${missionState}`}
                  onClick={() => setSelectedSlotIndex(index)}
                >
                  <span className="mission-card__step">{mission.step}</span>
                  <strong>{mission.title}</strong>
                  {slotSource?.previewUrl ? (
                    <img src={slotSource.previewUrl} alt={`${mission.title} preview`} />
                  ) : slotSource ? (
                    <div
                      className="mission-card__swatch"
                      style={{ backgroundImage: slotSource.previewTone }}
                    />
                  ) : (
                    <div className="mission-card__empty" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="capture-footer">
            <p className="status-note" aria-live="polite">
              {intakeNotice ||
                (sources.length === 0
                  ? 'Tap the green button and keep walking around the house.'
                  : `${sources.length} photo${sources.length === 1 ? '' : 's'} ready.`)}
            </p>
            {sources.length > 0 ? (
              <p className="status-note status-note--muted">
                {formatBytes(totalReferenceSize)} total
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {view === 'render' ? (
        <section className="panel screen-panel render-screen">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Step 2</p>
              <h2>Auto render</h2>
            </div>
            <p className="progress-chip">{sources.length} photos loaded</p>
          </div>

          {!canRender ? (
            <div className="empty-state-card">
              <h3>Take 4 photos first</h3>
              <p>Front, corners, and sides are enough to start the Minecraft shape.</p>
              <button type="button" className="upload-button" onClick={() => setView('capture')}>
                Go take photos
              </button>
            </div>
          ) : renderState === 'rendering' || isPending ? (
            <div className="rendering-card" data-testid="rendering-card">
              <p className="section-kicker">Working now</p>
              <h3>Building your reveal</h3>
              <div className="render-step-list" aria-label="Rendering progress">
                {RENDER_STEPS.map((step, index) => (
                  <div
                    key={step}
                    className={`render-step ${index <= renderStepIndex ? 'render-step--active' : ''}`}
                  >
                    <span>{index + 1}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="render-ready-stack">
              <div className="reveal-banner">
                <div className="reveal-banner__art">
                  <img
                    src={revealCelebrationCard}
                    alt="Celebration card showing a bright voxel house reveal with reward blocks."
                  />
                </div>
                <div className="reveal-banner__copy">
                  <p className="section-kicker">Quest clear</p>
                  <h3>{builderReward.title}</h3>
                  <p>You just turned this house into a Minecraft build quest.</p>
                  <div className="chip-row">
                    {revealBadges.map((badge) => (
                      <span key={badge} className="confidence-chip">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="render-ready-card">
                <div className="render-ready-card__header">
                  <div>
                    <p className="section-kicker">Render ready</p>
                    <h3>{plan.structureName}</h3>
                  </div>
                  <div className="chip-row">
                    <span className="confidence-chip">{plan.confidence}% confidence</span>
                    <span className="confidence-chip confidence-chip--muted">{analysisMode}</span>
                  </div>
                </div>
                <p className="render-ready-card__summary">{plan.summary}</p>
                <div className="metric-grid">
                  {quickBuildCards.map((card) => (
                    <article key={card.label} className="metric-card">
                      <span className="metric-label">{card.label}</span>
                      <strong>{card.value}</strong>
                      <p>{card.detail}</p>
                    </article>
                  ))}
                </div>
                <div className="render-ready-card__actions">
                  <button type="button" className="upload-button" onClick={() => setView('guide')}>
                    Build It Now
                  </button>
                  <button type="button" className="ghost-button" onClick={() => setView('capture')}>
                    Add more photos
                  </button>
                </div>
              </div>

              <div className="voxel-layout">
                <div className="skyline-card">
                  <div className="skyline-header">
                    <div>
                      <p className="section-kicker">Front read</p>
                      <h3>Silhouette</h3>
                    </div>
                    <p>{plan.dimensions.height} blocks tall</p>
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

                <div className="slice-card">
                  <div className="slice-header">
                    <div>
                      <p className="section-kicker">Block shell</p>
                      <h3>Layer preview</h3>
                    </div>
                    <p>{activeLayer.summary}</p>
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
                  <LayerPreview layer={activeLayer} width={plan.dimensions.width} />
                </div>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {view === 'guide' ? (
        <section className="panel screen-panel guide-screen">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Step 3</p>
              <h2>Build guide</h2>
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

          {renderState !== 'ready' ? (
            <div className="empty-state-card">
              <h3>Render the house first</h3>
              <p>Once the block model is ready, the step-by-step guide shows up here.</p>
              <button type="button" className="upload-button" onClick={() => setView('render')}>
                Go to render
              </button>
            </div>
          ) : (
            <>
              <div className="slice-guide-card">
                <div className="slice-guide-card__header">
                  <div>
                    <p className="section-kicker">Build the house upward</p>
                    <h3>{activeLayer.label}</h3>
                    <p>Show the house up through {activeLayer.elevation.toLowerCase()}.</p>
                  </div>
                  <div className="slice-guide-card__nav">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => stepActiveLayer(-1)}
                      disabled={activeLayerIndex === 0}
                    >
                      ← Lower
                    </button>
                    <span className="progress-chip">
                      {activeLayerIndex + 1} / {plan.layers.length}
                    </span>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => stepActiveLayer(1)}
                      disabled={activeLayerIndex === plan.layers.length - 1}
                    >
                      Raise →
                    </button>
                  </div>
                </div>

                <div className="slice-guide-card__layout">
                  <div className="slice-orbit-card">
                    <div className="slice-orbit-card__toolbar">
                      <p className="section-kicker">Rotate the house</p>
                      <div className="slice-rotation-row" role="tablist" aria-label="House view directions">
                        {SLICE_ROTATIONS.map((rotation) => (
                          <button
                            key={rotation}
                            type="button"
                            role="tab"
                            className={`slice-rotation-button ${guideRotation === rotation ? 'slice-rotation-button--active' : ''}`}
                            aria-selected={guideRotation === rotation}
                            onClick={() => setGuideRotation(rotation)}
                          >
                            {SLICE_ROTATION_LABELS[rotation]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <HouseBuildPreview
                      layers={plan.layers}
                      visibleLayerCount={activeLayerIndex + 1}
                      rotation={guideRotation}
                    />
                  </div>

                  <div className="slice-guide-notes">
                    <div className="slice-guide-notes__chips">
                      <span className="confidence-chip">{activeLayerSummary.footprint} footprint</span>
                      <span className="confidence-chip confidence-chip--muted">
                        {activeLayerSummary.wallCount} wall
                      </span>
                      <span className="confidence-chip confidence-chip--muted">
                        {activeLayerSummary.fillCount} fill
                      </span>
                      <span className="confidence-chip confidence-chip--muted">
                        {activeLayerSummary.highlightCount} accent
                      </span>
                    </div>

                    <div className="slice-guide-notes__card">
                      <p className="section-kicker">{SLICE_ROTATION_LABELS[guideRotation]} view</p>
                      <h3>Current top layer</h3>
                      <ul className="stage-list">
                        {activeLayerSummary.checklist.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <p className="slice-guide-notes__summary">{activeLayer.summary}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="guide-header-card">
                <div className="guide-header-card__copy">
                  <p className="section-kicker">Minecraft loadout</p>
                  <h3>{plan.theme}</h3>
                  <div className="chip-row">
                    {revealBadges.map((badge) => (
                      <span key={badge} className="confidence-chip">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="guide-header-card__art">
                  <img
                    src={builderBadgeStrip}
                    alt="Builder badge strip showing a blocky progress path."
                  />
                </div>
                <p>{plan.themeProfile.playstyle}</p>
              </div>

              <div className="replay-card">
                <div>
                  <p className="section-kicker">Do it again</p>
                  <h3>Try another house after this one</h3>
                  <p>When this build is done, reset and turn the next place into blocks too.</p>
                </div>
                <div className="secondary-actions">
                  <button type="button" className="upload-button" onClick={clearSession}>
                    Start Another Build
                  </button>
                  <button type="button" className="ghost-button" onClick={() => setView('render')}>
                    Back to Reveal
                  </button>
                </div>
              </div>

              <div className="hotbar-strip">
                {plan.palette.map((material) => (
                  <article key={material.block} className={`hotbar-slot tone-${material.tone}`}>
                    <span>{Math.ceil(material.amount / 64)} stacks</span>
                    <strong>{material.block}</strong>
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

              <details className="details-drawer">
                <summary>More build details</summary>
                <div className="details-drawer__content">
                  <div className="material-grid">
                    {plan.palette.map((material) => (
                      <article key={material.block} className={`material-card tone-${material.tone}`}>
                        <p className="material-amount">{material.amount.toLocaleString()} blocks</p>
                        <h3>{material.block}</h3>
                        <p>{material.purpose}</p>
                      </article>
                    ))}
                  </div>

                  {analysisWarnings.length > 0 ? (
                    <div className="warning-card">
                      <p className="section-kicker">Prototype note</p>
                      <ul className="warning-list">
                        {analysisWarnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </details>
            </>
          )}

          {exportNotice ? (
            <p className="status-note status-note--accent" aria-live="polite">
              {exportNotice}
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="mobile-hotbar" aria-label="Pocket hotbar actions">
        <button type="button" className="mobile-hotbar__slot mobile-hotbar__slot--primary" onClick={openCamera}>
          Camera
        </button>
        <button type="button" className="mobile-hotbar__slot" onClick={() => setView('render')} disabled={!canRender}>
          Render
        </button>
        <button
          type="button"
          className="mobile-hotbar__slot"
          onClick={() => setView('guide')}
          disabled={renderState !== 'ready'}
        >
          Guide
        </button>
        <button type="button" className="mobile-hotbar__slot" onClick={clearSession}>
          Reset
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
    <>
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
              title={`Row ${rowIndex + 1}, Column ${columnIndex + 1}: ${cell}`}
            />
          )),
        )}
      </div>

      <div className="layer-legend" aria-label="Voxel legend">
        <span>
          <i className="layer-cell layer-cell--wall" />
          Wall
        </span>
        <span>
          <i className="layer-cell layer-cell--fill" />
          Fill
        </span>
        <span>
          <i className="layer-cell layer-cell--highlight" />
          Accent
        </span>
        <span>
          <i className="layer-cell layer-cell--empty" />
          Empty
        </span>
      </div>
    </>
  )
}

type HouseBuildPreviewProps = {
  layers: LayerSlice[]
  visibleLayerCount: number
  rotation: SliceRotation
}

function HouseBuildPreview({
  layers,
  visibleLayerCount,
  rotation,
}: HouseBuildPreviewProps) {
  const tileWidth = 42
  const tileHeight = 22
  const blockDepth = 24
  const halfTileWidth = tileWidth / 2
  const halfTileHeight = tileHeight / 2

  const visibleLayers = layers.slice(0, visibleLayerCount)
  const activeTopLayer = visibleLayers.at(-1)
  const blocks = visibleLayers
    .flatMap((layer, layerIndex) => {
      const rotatedGrid = rotateLayerGrid(layer.grid, rotation)

      return rotatedGrid.flatMap((row, rowIndex) =>
        row.flatMap((cell, columnIndex) => {
          if (cell === 'empty') {
            return []
          }

          const isoLeft = (columnIndex - rowIndex) * halfTileWidth
          const isoTop = (columnIndex + rowIndex) * halfTileHeight - layerIndex * blockDepth

          return [
            {
              id: `${layer.id}-${rowIndex}-${columnIndex}-${cell}`,
              cell,
              isoLeft,
              isoTop,
              isCurrent: layerIndex === visibleLayers.length - 1,
              layerLabel: layer.label,
              paintOrder: rowIndex + columnIndex + layerIndex,
            },
          ]
        }),
      )
    })
    .sort((left, right) => left.paintOrder - right.paintOrder)

  if (blocks.length === 0) {
    return (
      <div className="slice-orbit">
        <p className="status-note">This slice is empty.</p>
      </div>
    )
  }

  const minLeft = Math.min(...blocks.map((block) => block.isoLeft))
  const maxLeft = Math.max(...blocks.map((block) => block.isoLeft))
  const minTop = Math.min(...blocks.map((block) => block.isoTop))
  const maxTop = Math.max(...blocks.map((block) => block.isoTop))
  const stageWidth = maxLeft - minLeft + tileWidth + 64
  const stageHeight = maxTop - minTop + tileHeight + blockDepth + 72

  return (
    <div className="slice-orbit" aria-label={`${rotation} 3D house preview through layer ${visibleLayerCount}`}>
      <div className="slice-orbit__hud">
        <span className="progress-chip">
          Layer {visibleLayerCount} / {layers.length}
        </span>
        {activeTopLayer ? (
          <span className="confidence-chip confidence-chip--muted">{activeTopLayer.label}</span>
        ) : null}
      </div>
      <div
        className="slice-orbit__stage"
        style={
          {
            width: `${stageWidth}px`,
            height: `${stageHeight}px`,
          } as CSSProperties
        }
      >
        {blocks.map((block) => (
          <div
            key={block.id}
            className={`iso-block iso-block--${block.cell} ${block.isCurrent ? 'iso-block--current' : ''}`}
            style={
              {
                left: `${block.isoLeft - minLeft + 24}px`,
                top: `${block.isoTop - minTop + 12}px`,
              } as CSSProperties
            }
            title={`${block.layerLabel}: ${block.cell}`}
          >
            <span className="iso-block__face iso-block__face--top" />
            <span className="iso-block__face iso-block__face--left" />
            <span className="iso-block__face iso-block__face--right" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
