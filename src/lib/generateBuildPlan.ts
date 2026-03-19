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

export type LayerCell = 'empty' | 'wall' | 'fill' | 'highlight' | 'roof'

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

export type ThemeProfile = {
  biome: string
  vibe: string
  playstyle: string
  mobileHint: string
  tags: string[]
}

export type BuildPlan = {
  structureName: string
  theme: string
  themeProfile: ThemeProfile
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

type Theme = ThemeProfile & {
  theme: string
  primary: string
  support: string
  roof: string
  detail: string
  light: string
}

const THEMES: Theme[] = [
  {
    theme: 'Cherry Grove Chalet',
    primary: 'Cherry Planks',
    support: 'Stripped Birch Logs',
    roof: 'Dark Oak Stairs',
    detail: 'Cherry Trapdoors',
    light: 'Lanterns',
    biome: 'Cherry Grove',
    vibe: 'Soft mountain chalet with pink-petal trim and an easy survival silhouette.',
    playstyle: 'Best for scenic family bases, overlook cabins, and cozy starter towns.',
    mobileHint:
      'Keep the roof pass broad first, then finish petals and trapdoors once the shell already reads well on a phone.',
    tags: ['Cherry wood', 'Pink petals', 'Mountain meadow'],
  },
  {
    theme: 'Copper Tuff Atelier',
    primary: 'Tuff Bricks',
    support: 'Polished Tuff',
    roof: 'Waxed Oxidized Cut Copper Stairs',
    detail: 'Copper Bulbs',
    light: 'Lanterns',
    biome: 'Trial Chamber',
    vibe: 'Mid-game workshop kit built around the copper-and-tuff language of trial chambers.',
    playstyle: 'Fits forge halls, redstone shops, vault rooms, and industrial overworld builds.',
    mobileHint:
      'Use tuff and copper as the first shell pass so touch edits stay legible while you refine corners and lights later.',
    tags: ['Tuff bricks', 'Copper bulbs', 'Dungeon workshop'],
  },
  {
    theme: 'Bamboo Mosaic Loft',
    primary: 'Bamboo Mosaic',
    support: 'Stripped Bamboo Blocks',
    roof: 'Dark Prismarine Stairs',
    detail: 'Bamboo Trapdoors',
    light: 'Pearlescent Froglights',
    biome: 'Bamboo Jungle',
    vibe: 'Airy loft with slatted floors, warm lantern glow, and a fast tropical read.',
    playstyle: 'Great for cliff homes, jungle walkways, breezy towers, and raft-side bases.',
    mobileHint:
      'Repeat mosaic stairs and trapdoors in bands so the build guide stays readable on a narrow screen.',
    tags: ['Bamboo mosaic', 'Raft dock', 'Froglight glow'],
  },
  {
    theme: 'Mangrove Dockhouse',
    primary: 'Mangrove Planks',
    support: 'Mud Bricks',
    roof: 'Mangrove Stairs',
    detail: 'Mangrove Trapdoors',
    light: 'Ochre Froglights',
    biome: 'Mangrove Swamp',
    vibe: 'Waterline dockhouse with muddy footing, warm planks, and a survival harbor feel.',
    playstyle: 'Strong for fishing ports, villager docks, and lowland survival hubs.',
    mobileHint:
      'Lock the dock posts and perimeter first so short phone sessions can pause without losing the footprint.',
    tags: ['Mangrove', 'Mud bricks', 'Harbor'],
  },
  {
    theme: 'Pale Garden Manor',
    primary: 'Pale Oak Planks',
    support: 'Stone Bricks',
    roof: 'Deepslate Tile Stairs',
    detail: 'Pale Oak Trapdoors',
    light: 'Lanterns',
    biome: 'Pale Garden',
    vibe: 'Quiet pale-oak manor with mossy accents and a moody exploration vibe.',
    playstyle: 'Ideal for eerie landmarks, mansion builds, and overworld adventure hubs.',
    mobileHint:
      'Save moss and hanging detail for the last pass so the main silhouette remains clean during phone-first building.',
    tags: ['Pale oak', 'Pale moss', 'Garden manor'],
  },
  {
    theme: 'Deep Tuff Watchtower',
    primary: 'Tuff Bricks',
    support: 'Cobbled Deepslate',
    roof: 'Polished Tuff Stairs',
    detail: 'Chiseled Tuff',
    light: 'Copper Bulbs',
    biome: 'Deep Slate Edge',
    vibe: 'Tall lookout with carved tuff ribs, copper lamps, and a strong spawn-facing silhouette.',
    playstyle: 'Works for spawn towers, map rooms, village watch posts, and cliff sentries.',
    mobileHint:
      'Stack repeated floor bands so the guide can be followed one thumb-scroll at a time.',
    tags: ['Chiseled tuff', 'Copper bulbs', 'Watchtower'],
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

function getRoofProfile(height: number, roofline: string) {
  const roofHeight =
    roofline === 'Gabled' ? clamp(Math.round(height * 0.28), 3, 5) : roofline === 'Stepped' ? clamp(Math.round(height * 0.22), 2, 4) : 2
  const roofStart = Math.max(3, height - roofHeight)

  return {
    roofHeight,
    roofStart,
  }
}

function buildLayerGrid(
  levelIndex: number,
  width: number,
  depth: number,
  height: number,
  roofline: string,
  floors: number,
  seed: number,
) {
  const center = Math.floor(width / 2)
  const doorHalfWidth = width >= 18 ? 1 : 0
  const { roofStart, roofHeight } = getRoofProfile(height, roofline)
  const windowBands = new Set(
    [
      Math.max(2, Math.round(roofStart * 0.34)),
      Math.max(3, Math.round(roofStart * 0.62)),
    ].filter((band) => band > 0 && band < roofStart - 1),
  )
  const loftBand = floors > 1 ? Math.max(2, Math.round((roofStart - 1) * 0.52)) : -1

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
        y === 0 && x >= center - doorHalfWidth && x <= center + doorHalfWidth && levelIndex <= 2
      const supportPost =
        x > 2 &&
        x < width - 3 &&
        y > 2 &&
        y < depth - 3 &&
        ((x + y) % 5 === 0 || hash3(seed, x, y) > 0.92)

      if (levelIndex === 0) {
        if (frontEntry) {
          return 'highlight'
        }
        if (cornerTower) {
          return 'highlight'
        }
        if (border || innerRing || supportPost) {
          return 'fill'
        }
        return hash3(seed, x, y) > 0.82 ? 'highlight' : 'fill'
      }

      if (levelIndex < roofStart) {
        if (frontEntry) {
          return 'empty'
        }
        if (cornerTower) {
          return levelIndex % 2 === 0 ? 'highlight' : 'wall'
        }
        if (border) {
          const frontOrBackWindow =
            (y === 0 || y === depth - 1) &&
            x > 2 &&
            x < width - 3 &&
            x % 3 !== 0
          const sideWindow =
            (x === 0 || x === width - 1) &&
            y > 2 &&
            y < depth - 3 &&
            y % 3 !== 0
          const shouldOpenWindow =
            windowBands.has(levelIndex) && (frontOrBackWindow || sideWindow)

          return shouldOpenWindow && hash3(seed, x, y, levelIndex) > 0.2 ? 'empty' : 'wall'
        }
        if (levelIndex === loftBand && x > 1 && x < width - 2 && y > 1 && y < depth - 2) {
          return 'fill'
        }
        if (supportPost) {
          return 'fill'
        }
        return 'empty'
      }

      const roofLevel = levelIndex - roofStart

      if (roofline === 'Gabled') {
        const inset = roofLevel

        if (x < inset || x >= width - inset) {
          return 'empty'
        }

        if (y === 0 || y === depth - 1) {
          return x === inset || x === width - 1 - inset ? 'highlight' : 'roof'
        }

        const roofEdge = x === inset || x === width - 1 - inset
        const ridgeWidth = width - inset * 2

        if (roofEdge) {
          return 'roof'
        }

        if (ridgeWidth <= 2) {
          return y % 4 === 0 ? 'highlight' : 'roof'
        }

        return hash3(seed, x, y, levelIndex) > 0.1 ? 'roof' : 'empty'
      }

      if (roofline === 'Stepped') {
        const inset = roofLevel

        if (x < inset || x >= width - inset || y < inset || y >= depth - inset) {
          return 'empty'
        }

        const terraceEdge =
          x === inset || x === width - 1 - inset || y === inset || y === depth - 1 - inset

        if (terraceEdge) {
          return roofLevel === roofHeight - 1 || cornerTower ? 'highlight' : 'roof'
        }

        return roofLevel === roofHeight - 1 && innerRing ? 'highlight' : 'roof'
      }

      if (border) {
        return levelIndex === roofStart ? 'wall' : 'roof'
      }

      if (levelIndex === roofStart) {
        return hash3(seed, x, y, 12) > 0.14 ? 'fill' : 'empty'
      }

      return levelIndex === height - 1 && hash3(seed, x, y, levelIndex) > 0.72
        ? 'highlight'
        : hash3(seed, x, y, levelIndex) > 0.9
          ? 'roof'
          : 'empty'
    }),
  )
}

function describeLayer(levelIndex: number, height: number, roofline: string) {
  const { roofStart } = getRoofProfile(height, roofline)
  const roofLevel = levelIndex - roofStart + 1

  if (levelIndex === 0) {
    return {
      label: 'Foundation',
      elevation: 'Layer 1',
      summary: 'Set the footprint, floor fill, and front-step anchor.',
    }
  }

  if (levelIndex < roofStart) {
    const bandLabel =
      levelIndex === 1 ? 'Door band' : levelIndex === roofStart - 1 ? 'Top wall band' : `Wall layer ${levelIndex + 1}`

    return {
      label: bandLabel,
      elevation: `Layer ${levelIndex + 1}`,
      summary:
        levelIndex === 1
          ? 'Keep the entry open while you raise the first wall ring.'
          : levelIndex % 2 === 0
            ? 'Continue the shell and line up windows and trims.'
            : 'Carry the wall ring and interior supports upward.',
    }
  }

  if (levelIndex === height - 1) {
    return {
      label: 'Roof peak',
      elevation: `Layer ${levelIndex + 1}`,
      summary: `Finish the ${roofline.toLowerCase()} cap and lock the top silhouette.`,
    }
  }

  return {
    label: `Roof ${roofLevel}`,
    elevation: `Layer ${levelIndex + 1}`,
    summary: `${roofline} roof pass ${roofLevel} steps inward to shape the top profile.`,
  }
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

  const layers: LayerSlice[] = Array.from({ length: height }, (_, levelIndex) => {
    const description = describeLayer(levelIndex, height, roofline)

    return {
      id: `layer-${levelIndex + 1}`,
      label: description.label,
      elevation: description.elevation,
      summary: description.summary,
      grid: buildLayerGrid(levelIndex, width, depth, height, roofline, floors, seed),
    }
  })

  const skyline = buildSkyline(width, height, roofline, seed)

  const insights: Insight[] = [
    {
      label: 'Footprint',
      value: `${width} x ${depth} blocks`,
      detail: 'Chunk-ready pad size before paths, farms, or terrain dressing.',
    },
    {
      label: 'Stack height',
      value: `${height} blocks tall`,
      detail: `${floors} interpreted floor band${floors > 1 ? 's' : ''} for the shell pass.`,
    },
    {
      label: 'Roofline',
      value: roofline,
      detail: 'Picked from the skyline read across the reference pack.',
    },
    {
      label: 'Block kit',
      value: theme.theme,
      detail: `Palette anchored by ${theme.primary.toLowerCase()} and companion detail blocks.`,
    },
  ]

  const sourceNotes = sources.map(
    (source) => `${source.role}: ${source.notes}`,
  )

  const stages: BuildStage[] = [
    {
      title: 'Stake the chunk',
      window: 'Layers 0-1',
      goal: `Clear a ${width + 4} x ${depth + 4} site and center the build pad.`,
      checklist: [
        `Lay the ${width} x ${depth} footprint with ${theme.support}.`,
        'Mark each corner with a 2 x 2 anchor so the shell reads cleanly from spawn.',
        'Leave the centered front opening clear before lifting the facade.',
      ],
      output: 'Foundation ring and anchor points are locked in.',
      materials: `${theme.support}, ${theme.primary}`,
    },
    {
      title: 'Lift the shell',
      window: `Layers 2-${Math.max(4, Math.round(height * 0.45))}`,
      goal: 'Build the perimeter walls first so the silhouette lands before details.',
      checklist: [
        `Run the outer shell in ${theme.primary}.`,
        'Keep the entry notch open and mirror the wall rhythm on both sides.',
        'Drop interior posts where the foundation grid shows support columns.',
      ],
      output: 'Doorway, wall thickness, and first floor volume are visible.',
      materials: `${theme.primary}, ${theme.support}`,
    },
    {
      title: 'Dress the facade',
      window: `Layers ${Math.max(5, Math.round(height * 0.5))}-${Math.max(
        7,
        Math.round(height * 0.78),
      )}`,
      goal: 'Use the upper shell pass to set windows, trim, and a cleaner build rhythm.',
      checklist: [
        `Add trim breaks with ${theme.detail}.`,
        'Reserve the center spine for stair, loft, or lookout access.',
        'Treat empty cells on the slice map as windows, awnings, or open-air breaks.',
      ],
      output: 'The structure reads as intentional rather than a plain box.',
      materials: `${theme.detail}, ${theme.primary}`,
    },
    {
      title: 'Cap the skyline',
      window: `Layers ${Math.max(8, height - 2)}-${height}`,
      goal: `Finish the ${roofline.toLowerCase()} roof and drop in guidance lighting.`,
      checklist: [
        `Cap the roof in ${theme.roof}.`,
        `Highlight the entrance and corners using ${theme.light}.`,
        'Do one final walk around and soften exposed flat faces with extra trim.',
      ],
      output: 'Roof silhouette and night readability are complete.',
      materials: `${theme.roof}, ${theme.light}`,
    },
  ]

  const summary = `Pocket build pass from ${sources.length} reference photo${
    sources.length === 1 ? '' : 's'
  } suggests a ${theme.theme.toLowerCase()} rooted in ${theme.biome.toLowerCase()} cues, with a ${roofline.toLowerCase()} profile and a ${width} x ${depth} footprint for a fast Minecraft shell.`

  return {
    structureName,
    theme: theme.theme,
    themeProfile: {
      biome: theme.biome,
      vibe: theme.vibe,
      playstyle: theme.playstyle,
      mobileHint: theme.mobileHint,
      tags: theme.tags,
    },
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
