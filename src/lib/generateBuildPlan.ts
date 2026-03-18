export const SHOT_ROLE_CYCLE = ['Front', 'Corner', 'Side', 'Roof'] as const

export type ShotRole = (typeof SHOT_ROLE_CYCLE)[number]

export type SourceImage = {
  id: string
  name: string
  sizeBytes: number
  role: ShotRole
  notes: string
  previewTone: string
  previewUrl?: string
  objectUrl?: boolean
  isDemo?: boolean
}

export type MaterialEstimate = {
  block: string
  amount: number
  purpose: string
  tone: 'shell' | 'support' | 'roof' | 'detail' | 'light'
}

export type Insight = {
  label: string
  value: string
  detail: string
}

export type LayerCell = 'empty' | 'wall' | 'fill' | 'highlight'

export type LayerSlice = {
  id: string
  label: string
  elevation: string
  summary: string
  grid: LayerCell[][]
}

export type BuildStage = {
  title: string
  window: string
  goal: string
  checklist: string[]
  output: string
  materials: string
}

export type BuildPlan = {
  structureName: string
  theme: string
  roofline: string
  summary: string
  confidence: number
  totalBlocks: number
  dominantMaterial: string
  dimensions: {
    width: number
    depth: number
    height: number
    floors: number
  }
  insights: Insight[]
  sourceNotes: string[]
  palette: MaterialEstimate[]
  layers: LayerSlice[]
  stages: BuildStage[]
  skyline: number[]
}

type Theme = {
  theme: string
  primary: string
  support: string
  roof: string
  detail: string
  light: string
}

const THEMES: Theme[] = [
  {
    theme: 'Harbor Workshop',
    primary: 'Stone Bricks',
    support: 'Stripped Oak',
    roof: 'Dark Prismarine Stairs',
    detail: 'Warped Trapdoors',
    light: 'Lanterns',
  },
  {
    theme: 'Hilltop Lodge',
    primary: 'Spruce Planks',
    support: 'Cobblestone',
    roof: 'Dark Oak Stairs',
    detail: 'Campfire Chimney',
    light: 'Soul Lanterns',
  },
  {
    theme: 'Quarry Hall',
    primary: 'Tuff Bricks',
    support: 'Polished Andesite',
    roof: 'Deepslate Tiles',
    detail: 'Iron Bars',
    light: 'Glowstone',
  },
  {
    theme: 'Market Annex',
    primary: 'Mud Bricks',
    support: 'Mangrove Planks',
    roof: 'Red Nether Brick Stairs',
    detail: 'Acacia Trapdoors',
    light: 'Chains and Lanterns',
  },
  {
    theme: 'Sunwashed Villa',
    primary: 'Smooth Sandstone',
    support: 'Cut Sandstone',
    roof: 'Orange Terracotta',
    detail: 'Birch Trapdoors',
    light: 'Sea Lanterns',
  },
]

const DEMO_SOURCES: Omit<SourceImage, 'id'>[] = [
  {
    name: 'harbor-workshop-front.jpg',
    sizeBytes: 2_480_000,
    role: 'Front',
    notes: 'Strong doorway silhouette and chimney placement.',
    previewTone: 'linear-gradient(135deg, #3b5b6d 0%, #d4b483 100%)',
    isDemo: true,
  },
  {
    name: 'harbor-workshop-corner.jpg',
    sizeBytes: 2_920_000,
    role: 'Corner',
    notes: 'Corner angle clarifies roof pitch and side depth.',
    previewTone: 'linear-gradient(135deg, #6f4e37 0%, #8fb996 100%)',
    isDemo: true,
  },
  {
    name: 'harbor-workshop-side.jpg',
    sizeBytes: 2_160_000,
    role: 'Side',
    notes: 'Side run suggests repeat window rhythm and annex width.',
    previewTone: 'linear-gradient(135deg, #516f44 0%, #d6d2c4 100%)',
    isDemo: true,
  },
  {
    name: 'harbor-workshop-roof.jpg',
    sizeBytes: 1_740_000,
    role: 'Roof',
    notes: 'Upper angle hints at a gabled cap with edge trim.',
    previewTone: 'linear-gradient(135deg, #1f3a5f 0%, #9bb4c9 100%)',
    isDemo: true,
  },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hash(value: number) {
  const raw = Math.sin(value) * 10000
  return raw - Math.floor(raw)
}

function hash3(seed: number, a: number, b: number, c = 0) {
  return hash(seed * 0.173 + a * 12.9898 + b * 78.233 + c * 37.719)
}

function toTitleCase(value: string) {
  return value
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '')
}

function summarizeName(sources: SourceImage[]) {
  const stopwords = new Set([
    'front',
    'corner',
    'side',
    'roof',
    'photo',
    'img',
    'image',
    'view',
    'shot',
  ])

  const tokenCount = new Map<string, number>()

  for (const source of sources) {
    for (const token of stripExtension(source.name).split(/[\s_-]+/)) {
      const normalized = token.toLowerCase()
      if (normalized.length < 3 || stopwords.has(normalized)) {
        continue
      }
      tokenCount.set(normalized, (tokenCount.get(normalized) ?? 0) + 1)
    }
  }

  const commonTokens = [...tokenCount.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 2)
    .map(([token]) => token)

  if (commonTokens.length > 0) {
    return commonTokens.map(toTitleCase).join(' ')
  }

  return toTitleCase(stripExtension(sources[0]?.name ?? 'New Build'))
}

function createSeed(sources: SourceImage[]) {
  return sources.reduce((sum, source, index) => {
    const nameScore = [...source.name].reduce(
      (characterSum, character, characterIndex) =>
        characterSum + character.charCodeAt(0) * (characterIndex + 1),
      0,
    )

    return sum + nameScore + source.sizeBytes * (index + 1)
  }, 7919)
}

function buildSkyline(
  width: number,
  height: number,
  roofline: string,
  seed: number,
) {
  const center = (width - 1) / 2

  return Array.from({ length: width }, (_, index) => {
    const distance = Math.abs(index - center)
    const towerBoost = index < 2 || index >= width - 2 ? 2 : 0
    const noise = Math.round(hash3(seed, index, height) * 2)

    if (roofline === 'Gabled') {
      const roofBoost = Math.max(0, Math.round(width / 4 - distance / 1.5))
      return clamp(height - 3 + roofBoost + towerBoost - noise, 4, height + 2)
    }

    if (roofline === 'Stepped') {
      const terraceBoost =
        index % 4 === 0 ? 2 : index % 3 === 0 ? 1 : Math.round(hash3(seed, index, 5))
      return clamp(height - 3 + terraceBoost + towerBoost - noise, 4, height + 2)
    }

    return clamp(height - 2 + towerBoost - noise, 4, height + 1)
  })
}

function buildLayerGrid(
  kind: LayerSlice['id'],
  width: number,
  depth: number,
  roofline: string,
  seed: number,
) {
  const center = Math.floor(width / 2)
  const doorHalfWidth = width >= 18 ? 1 : 0

  return Array.from({ length: depth }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      const border = x === 0 || y === 0 || x === width - 1 || y === depth - 1
      const innerRing = x === 1 || y === 1 || x === width - 2 || y === depth - 2
      const cornerTower =
        (x < 2 && y < 2) ||
        (x >= width - 2 && y < 2) ||
        (x < 2 && y >= depth - 2) ||
        (x >= width - 2 && y >= depth - 2)
      const frontEntry =
        y === 0 && x >= center - doorHalfWidth && x <= center + doorHalfWidth
      const supportPost =
        x > 2 &&
        x < width - 3 &&
        y > 2 &&
        y < depth - 3 &&
        ((x + y) % 5 === 0 || hash3(seed, x, y) > 0.92)

      if (kind === 'foundation') {
        if (cornerTower) {
          return 'highlight'
        }
        if (border || innerRing || supportPost) {
          return 'fill'
        }
        return hash3(seed, x, y) > 0.88 ? 'fill' : 'empty'
      }

      if (kind === 'lower-shell') {
        if (frontEntry) {
          return 'empty'
        }
        if (cornerTower) {
          return 'highlight'
        }
        if (border) {
          return 'wall'
        }
        if (supportPost) {
          return 'fill'
        }
        return 'empty'
      }

      if (kind === 'upper-shell') {
        if (cornerTower) {
          return 'highlight'
        }
        if (border) {
          return hash3(seed, x, y, 4) > 0.2 ? 'wall' : 'empty'
        }
        if (x === center || x === center - 1) {
          return 'fill'
        }
        return hash3(seed, x, y, 8) > 0.95 ? 'fill' : 'empty'
      }

      if (cornerTower) {
        return 'highlight'
      }

      if (roofline === 'Gabled') {
        const ridgeSpread = Math.max(1, Math.round(width / 5))
        if (Math.abs(x - center) <= ridgeSpread && y > 0 && y < depth - 1) {
          return 'fill'
        }
      }

      if (roofline === 'Stepped' && innerRing) {
        return 'fill'
      }

      if (roofline === 'Parapet' && border) {
        return 'wall'
      }

      return border ? 'wall' : hash3(seed, x, y, 12) > 0.9 ? 'fill' : 'empty'
    }),
  )
}

export function createDemoSources() {
  return DEMO_SOURCES.map((source, index) => ({
    ...source,
    id: `demo-${index + 1}`,
  }))
}

export function buildPlanFromSources(inputSources: SourceImage[]): BuildPlan {
  const sources = inputSources.length > 0 ? inputSources : createDemoSources()
  const seed = createSeed(sources)
  const averageKb =
    sources.reduce((sum, source) => sum + source.sizeBytes / 1024, 0) / sources.length
  const width = clamp(12 + sources.length * 2 + Math.round(averageKb % 5), 12, 24)
  const depth = clamp(10 + sources.length * 2 + Math.round((averageKb / 2) % 4), 10, 22)
  const height = clamp(8 + sources.length * 2 + Math.round((averageKb / 3) % 5), 8, 18)
  const floors = height >= 15 ? 3 : height >= 10 ? 2 : 1
  const theme = THEMES[seed % THEMES.length]
  const roofline = (['Gabled', 'Stepped', 'Parapet'] as const)[seed % 3]
  const structureName = `${summarizeName(sources)} Concept`
  const footprint = width * depth
  const perimeter = width * 2 + depth * 2
  const shellBlocks = Math.round(perimeter * height * 0.72)
  const supportBlocks = Math.round(footprint * 0.38 + floors * width * 0.8)
  const roofBlocks = Math.round(footprint * 0.58)
  const detailBlocks = Math.round(perimeter * 0.44)
  const lightBlocks = Math.max(12, Math.round(perimeter * 0.18))
  const totalBlocks =
    shellBlocks + supportBlocks + roofBlocks + detailBlocks + lightBlocks
  const confidence = clamp(64 + sources.length * 6 + Math.round(hash(seed) * 10), 64, 95)

  const palette: MaterialEstimate[] = [
    {
      block: theme.primary,
      amount: shellBlocks,
      purpose: 'Main exterior shell and long wall runs',
      tone: 'shell',
    },
    {
      block: theme.support,
      amount: supportBlocks,
      purpose: 'Foundation ring, corners, and interior posts',
      tone: 'support',
    },
    {
      block: theme.roof,
      amount: roofBlocks,
      purpose: `${roofline.toLowerCase()} roofline and cap details`,
      tone: 'roof',
    },
    {
      block: theme.detail,
      amount: detailBlocks,
      purpose: 'Window framing, fascia, and edge trim',
      tone: 'detail',
    },
    {
      block: theme.light,
      amount: lightBlocks,
      purpose: 'Entry lighting and perimeter wayfinding',
      tone: 'light',
    },
  ]

  const layers: LayerSlice[] = [
    {
      id: 'foundation',
      label: 'Foundation',
      elevation: 'Layer 0-1',
      summary: 'Solid pad, corner anchors, and interior supports.',
      grid: buildLayerGrid('foundation', width, depth, roofline, seed),
    },
    {
      id: 'lower-shell',
      label: 'Lower Shell',
      elevation: `Layer ${Math.max(2, Math.round(height * 0.28))}`,
      summary: 'Main doorway opening and first pass wall silhouette.',
      grid: buildLayerGrid('lower-shell', width, depth, roofline, seed),
    },
    {
      id: 'upper-shell',
      label: 'Upper Shell',
      elevation: `Layer ${Math.max(4, Math.round(height * 0.6))}`,
      summary: 'Window rhythm, support spine, and trim band alignment.',
      grid: buildLayerGrid('upper-shell', width, depth, roofline, seed),
    },
    {
      id: 'roofline',
      label: 'Roofline',
      elevation: `Layer ${height}`,
      summary: `${roofline} cap used to lock the silhouette before detailing.`,
      grid: buildLayerGrid('roofline', width, depth, roofline, seed),
    },
  ]

  const skyline = buildSkyline(width, height, roofline, seed)

  const insights: Insight[] = [
    {
      label: 'Footprint',
      value: `${width} x ${depth} blocks`,
      detail: 'Pad size before landscaping or walkways.',
    },
    {
      label: 'Vertical read',
      value: `${height} blocks tall`,
      detail: `${floors} interpreted floor band${floors > 1 ? 's' : ''}.`,
    },
    {
      label: 'Roof guess',
      value: roofline,
      detail: 'Chosen from silhouette agreement across the reference set.',
    },
    {
      label: 'Theme',
      value: theme.theme,
      detail: `Material package anchored by ${theme.primary.toLowerCase()}.`,
    },
  ]

  const sourceNotes = sources.map(
    (source) => `${source.role}: ${source.notes}`,
  )

  const stages: BuildStage[] = [
    {
      title: 'Mark the pad',
      window: 'Layers 0-1',
      goal: `Clear a ${width + 4} x ${depth + 4} site and center the build pad.`,
      checklist: [
        `Lay the ${width} x ${depth} footprint with ${theme.support}.`,
        'Mark each corner with a 2 x 2 anchor so the silhouette stays true.',
        'Leave the centered front opening clear before lifting the facade.',
      ],
      output: 'Foundation ring and anchor points are locked in.',
      materials: `${theme.support}, ${theme.primary}`,
    },
    {
      title: 'Raise the shell',
      window: `Layers 2-${Math.max(4, Math.round(height * 0.45))}`,
      goal: 'Build the perimeter walls first so the massing reads from a distance.',
      checklist: [
        `Run the outer shell in ${theme.primary}.`,
        'Keep the entry notch open and mirror the long wall rhythm on both sides.',
        'Drop interior posts where the foundation grid shows support columns.',
      ],
      output: 'Doorway, wall thickness, and first floor volume are visible.',
      materials: `${theme.primary}, ${theme.support}`,
    },
    {
      title: 'Shape the upper band',
      window: `Layers ${Math.max(5, Math.round(height * 0.5))}-${Math.max(
        7,
        Math.round(height * 0.78),
      )}`,
      goal: 'Use the upper shell pass to establish windows, trim, and vertical rhythm.',
      checklist: [
        `Add trim breaks with ${theme.detail}.`,
        'Reserve the center spine for stair, loft, or lookout access.',
        'Treat empty cells on the slice map as window or open-air breaks.',
      ],
      output: 'The structure reads as intentional rather than a plain box.',
      materials: `${theme.detail}, ${theme.primary}`,
    },
    {
      title: 'Cap and light',
      window: `Layers ${Math.max(8, height - 2)}-${height}`,
      goal: `Finish the ${roofline.toLowerCase()} roof and add navigation lighting.`,
      checklist: [
        `Cap the roof in ${theme.roof}.`,
        `Highlight the entrance and corners using ${theme.light}.`,
        'Do one final walk around and soften exposed flat faces with extra trim.',
      ],
      output: 'Roof silhouette and night readability are complete.',
      materials: `${theme.roof}, ${theme.light}`,
    },
  ]

  const summary = `Mock reconstruction from ${sources.length} reference photo${
    sources.length === 1 ? '' : 's'
  } suggests a ${theme.theme.toLowerCase()} with a ${roofline.toLowerCase()} profile and a ${
    width
  } x ${depth} footprint.`

  return {
    structureName,
    theme: theme.theme,
    roofline,
    summary,
    confidence,
    totalBlocks,
    dominantMaterial: theme.primary,
    dimensions: {
      width,
      depth,
      height,
      floors,
    },
    insights,
    sourceNotes,
    palette,
    layers,
    stages,
    skyline,
  }
}
