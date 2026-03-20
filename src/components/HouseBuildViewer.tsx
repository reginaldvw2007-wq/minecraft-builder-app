import { OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { LayerCell, LayerSlice } from '../lib/generateBuildPlan'

type HouseBuildViewerProps = {
  layers: LayerSlice[]
  visibleLayerCount: number
  activeLayerLabel: string
  onStepLayer: (direction: -1 | 1) => void
  canLower: boolean
  canRaise: boolean
}

type VisibleVoxelBlock = {
  id: string
  cell: Exclude<LayerCell, 'empty'>
  layerLabel: string
  isCurrent: boolean
  position: [number, number, number]
}

type BlockMaterialPalette = {
  topBase: string
  topAccent: string
  sideBase: string
  sideAccent: string
  bottomBase: string
}

type MaterialPair = {
  standard: THREE.MeshStandardMaterial[]
  current: THREE.MeshStandardMaterial[]
}

type ControlHandle = OrbitControlsImpl

type HomeView = {
  position: THREE.Vector3
  target: THREE.Vector3
}

type ViewerRigProps = {
  width: number
  depth: number
  visibleLayerCount: number
  controlsRef: MutableRefObject<ControlHandle | null>
  homeViewRef: MutableRefObject<HomeView | null>
}

const BLOCK_SIZE = 0.92
const BLOCK_STEP = 1
const BOX_GEOMETRY = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)

const BLOCK_PALETTES: Record<Exclude<LayerCell, 'empty'>, BlockMaterialPalette> = {
  wall: {
    topBase: '#d9a55d',
    topAccent: '#b37031',
    sideBase: '#9f6a35',
    sideAccent: '#6b4318',
    bottomBase: '#4c2f11',
  },
  fill: {
    topBase: '#98ad8d',
    topAccent: '#c6d8b7',
    sideBase: '#6a7f60',
    sideAccent: '#485940',
    bottomBase: '#31412d',
  },
  highlight: {
    topBase: '#f4d571',
    topAccent: '#fff0b1',
    sideBase: '#d8a73c',
    sideAccent: '#98681d',
    bottomBase: '#65440d',
  },
  roof: {
    topBase: '#7f8daa',
    topAccent: '#acb9d5',
    sideBase: '#566076',
    sideAccent: '#384050',
    bottomBase: '#212733',
  },
}

function createPixelTexture(
  base: string,
  accent: string,
  shadow: string,
  face: 'top' | 'side' | 'bottom',
) {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16

    const context = canvas.getContext('2d')

    if (!context) {
      return null
    }

    context.imageSmoothingEnabled = false
    context.fillStyle = base
    context.fillRect(0, 0, 16, 16)

    if (face === 'top') {
      context.fillStyle = accent
      context.fillRect(0, 0, 16, 3)
      context.fillStyle = shadow
      context.fillRect(0, 12, 16, 4)
    } else if (face === 'bottom') {
      context.fillStyle = shadow
      context.fillRect(0, 0, 16, 16)
    } else {
      context.fillStyle = accent
      context.fillRect(0, 0, 16, 2)
      context.fillStyle = shadow
      context.fillRect(0, 12, 16, 4)
    }

    context.fillStyle = shadow

    for (let offset = 0; offset < 16; offset += 4) {
      context.fillRect(offset, 0, 1, 16)
      context.fillRect(0, offset, 16, 1)
    }

    context.fillStyle = accent
    context.fillRect(3, 3, 3, 2)
    context.fillRect(9, 6, 2, 2)
    context.fillRect(6, 10, 4, 2)

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true

    return texture
  } catch {
    return null
  }
}

function createFaceMaterial(
  color: string,
  texture: THREE.Texture | null,
  emissive: string,
  emissiveIntensity: number,
) {
  return new THREE.MeshStandardMaterial({
    color,
    map: texture ?? undefined,
    roughness: 1,
    metalness: 0,
    flatShading: true,
    emissive,
    emissiveIntensity,
  })
}

function createBlockMaterials(): Record<Exclude<LayerCell, 'empty'>, MaterialPair> {
  return {
    wall: createMaterialPair(BLOCK_PALETTES.wall),
    fill: createMaterialPair(BLOCK_PALETTES.fill),
    highlight: createMaterialPair(BLOCK_PALETTES.highlight),
    roof: createMaterialPair(BLOCK_PALETTES.roof),
  }
}

function createMaterialPair(palette: BlockMaterialPalette): MaterialPair {
  const topTexture = createPixelTexture(
    palette.topBase,
    palette.topAccent,
    palette.sideAccent,
    'top',
  )
  const sideTexture = createPixelTexture(
    palette.sideBase,
    palette.topAccent,
    palette.sideAccent,
    'side',
  )
  const bottomTexture = createPixelTexture(
    palette.bottomBase,
    palette.sideAccent,
    palette.bottomBase,
    'bottom',
  )

  const standard = [
    createFaceMaterial(palette.sideBase, sideTexture, '#000000', 0),
    createFaceMaterial(palette.sideBase, sideTexture, '#000000', 0),
    createFaceMaterial(palette.topBase, topTexture, '#000000', 0),
    createFaceMaterial(palette.bottomBase, bottomTexture, '#000000', 0),
    createFaceMaterial(palette.sideBase, sideTexture, '#000000', 0),
    createFaceMaterial(palette.sideBase, sideTexture, '#000000', 0),
  ]
  const current = [
    createFaceMaterial(palette.sideBase, sideTexture, '#ffdb78', 0.12),
    createFaceMaterial(palette.sideBase, sideTexture, '#ffdb78', 0.12),
    createFaceMaterial(palette.topBase, topTexture, '#fff0b6', 0.16),
    createFaceMaterial(palette.bottomBase, bottomTexture, '#ffdb78', 0.08),
    createFaceMaterial(palette.sideBase, sideTexture, '#ffdb78', 0.12),
    createFaceMaterial(palette.sideBase, sideTexture, '#ffdb78', 0.12),
  ]

  return {
    standard,
    current,
  }
}

function disposeMaterials(materials: Record<Exclude<LayerCell, 'empty'>, MaterialPair>) {
  for (const pair of Object.values(materials)) {
    for (const material of [...pair.standard, ...pair.current]) {
      material.map?.dispose()
      material.dispose()
    }
  }
}

function ViewerRig({
  width,
  depth,
  visibleLayerCount,
  controlsRef,
  homeViewRef,
}: ViewerRigProps) {
  const { camera } = useThree()
  const previousTargetYRef = useRef<number | null>(null)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    const maxSpan = Math.max(width, depth, visibleLayerCount * 1.25)
    const targetY = Math.max((visibleLayerCount - 1) * 0.5, 1.25)
    const nextHomeView = {
      position: new THREE.Vector3(maxSpan * 0.92, maxSpan * 0.74, maxSpan * 0.88),
      target: new THREE.Vector3(0, targetY, 0),
    }

    homeViewRef.current = nextHomeView

    if (!controlsRef.current) {
      return
    }

    if (!hasInitializedRef.current) {
      camera.position.copy(nextHomeView.position)
      controlsRef.current.target.copy(nextHomeView.target)
      controlsRef.current.update()
      hasInitializedRef.current = true
    } else if (previousTargetYRef.current !== null) {
      const deltaY = targetY - previousTargetYRef.current
      controlsRef.current.target.y += deltaY
      controlsRef.current.update()
    }

    previousTargetYRef.current = targetY
  }, [camera, controlsRef, depth, homeViewRef, visibleLayerCount, width])

  return null
}

export function HouseBuildViewer({
  layers,
  visibleLayerCount,
  activeLayerLabel,
  onStepLayer,
  canLower,
  canRaise,
}: HouseBuildViewerProps) {
  const controlsRef = useRef<ControlHandle | null>(null)
  const homeViewRef = useRef<HomeView | null>(null)
  const materials = useMemo(() => createBlockMaterials(), [])
  const visibleLayers = layers.slice(0, visibleLayerCount)
  const activeTopLayer = visibleLayers.at(-1)
  const width = visibleLayers[0]?.grid[0]?.length ?? 0
  const depth = visibleLayers[0]?.grid.length ?? 0
  const maxSpan = Math.max(width, depth, visibleLayerCount * 1.25, 10)

  const blocks = useMemo<VisibleVoxelBlock[]>(() => {
    const occupancy = new Set<string>()

    visibleLayers.forEach((layer, layerIndex) => {
      layer.grid.forEach((row, rowIndex) => {
        row.forEach((cell, columnIndex) => {
          if (cell !== 'empty') {
            occupancy.add(`${columnIndex}:${layerIndex}:${rowIndex}`)
          }
        })
      })
    })

    return visibleLayers.flatMap((layer, layerIndex) =>
      layer.grid.flatMap((row, rowIndex) =>
        row.flatMap((cell, columnIndex) => {
          if (cell === 'empty') {
            return []
          }

          const neighbors = [
            [1, 0, 0],
            [-1, 0, 0],
            [0, 1, 0],
            [0, -1, 0],
            [0, 0, 1],
            [0, 0, -1],
          ] as const
          const isExposed = neighbors.some(
            ([dx, dy, dz]) => !occupancy.has(`${columnIndex + dx}:${layerIndex + dy}:${rowIndex + dz}`),
          )

          if (!isExposed) {
            return []
          }

          return [
            {
              id: `${layer.id}-${rowIndex}-${columnIndex}-${cell}`,
              cell,
              layerLabel: layer.label,
              isCurrent: layerIndex === visibleLayers.length - 1,
              position: [
                (columnIndex - (width - 1) / 2) * BLOCK_STEP,
                layerIndex * BLOCK_STEP + BLOCK_SIZE / 2,
                ((depth - 1) / 2 - rowIndex) * BLOCK_STEP,
              ],
            },
          ]
        }),
      ),
    )
  }, [depth, visibleLayers, width])

  useEffect(() => {
    return () => {
      disposeMaterials(materials)
    }
  }, [materials])

  if (blocks.length === 0 || width === 0 || depth === 0) {
    return (
      <div className="slice-orbit">
        <p className="status-note">This slice is empty.</p>
      </div>
    )
  }

  function resetView() {
    const homeView = homeViewRef.current

    if (!homeView || !controlsRef.current) {
      return
    }

    controlsRef.current.object.position.copy(homeView.position)
    controlsRef.current.target.copy(homeView.target)
    controlsRef.current.update()
  }

  return (
    <div className="slice-orbit" aria-label={`3D house preview through layer ${visibleLayerCount}`}>
      <div className="slice-orbit__hud">
        <span className="progress-chip">
          Layer {visibleLayerCount} / {layers.length}
        </span>
        {activeTopLayer ? (
          <span className="confidence-chip confidence-chip--muted">{activeTopLayer.label}</span>
        ) : null}
        <button type="button" className="slice-orbit__reset" onClick={resetView}>
          Front view
        </button>
      </div>

      <div className="slice-orbit__prompt">
        <span>Drag to spin. Pinch to zoom.</span>
      </div>

      <div className="slice-orbit__canvas">
        <Canvas
          dpr={[1, 1.6]}
          camera={{ fov: 36, near: 0.1, far: 240, position: [maxSpan, maxSpan * 0.7, maxSpan] }}
        >
          <color attach="background" args={['#132735']} />
          <fog attach="fog" args={['#132735', maxSpan * 1.4, maxSpan * 3.4]} />
          <ambientLight intensity={1.45} />
          <hemisphereLight args={['#dfefff', '#112311', 1.1]} />
          <directionalLight position={[maxSpan * 0.9, maxSpan * 1.6, maxSpan * 0.7]} intensity={2.1} />
          <directionalLight position={[-maxSpan * 0.6, maxSpan, -maxSpan]} intensity={0.8} />

          <ViewerRig
            width={width}
            depth={depth}
            visibleLayerCount={visibleLayerCount}
            controlsRef={controlsRef}
            homeViewRef={homeViewRef}
          />

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.85}
            zoomSpeed={0.78}
            minDistance={Math.max(maxSpan * 0.75, 8)}
            maxDistance={Math.max(maxSpan * 2.3, 20)}
            minPolarAngle={0.42}
            maxPolarAngle={1.46}
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN,
            }}
          />

          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, 0]}>
            <planeGeometry args={[width + 6, depth + 6]} />
            <meshStandardMaterial color="#35473d" roughness={1} metalness={0} />
          </mesh>

          <gridHelper
            args={[Math.max(width, depth) + 6, Math.max(width, depth) + 6, '#9bc26a', '#3d4f45']}
            position={[0, 0.02, 0]}
          />

          <group>
            {blocks.map((block) => (
              <mesh
                key={block.id}
                castShadow={false}
                receiveShadow={false}
                geometry={BOX_GEOMETRY}
                material={block.isCurrent ? materials[block.cell].current : materials[block.cell].standard}
                position={block.position}
                scale={block.isCurrent ? 0.97 : 0.94}
              />
            ))}
          </group>
        </Canvas>
      </div>

      <div className="slice-orbit__controls">
        <button
          type="button"
          className="slice-orbit__step"
          onClick={() => onStepLayer(-1)}
          disabled={!canLower}
        >
          ← Back a level
        </button>
        <span className="progress-chip">{activeLayerLabel}</span>
        <button
          type="button"
          className="slice-orbit__step"
          onClick={() => onStepLayer(1)}
          disabled={!canRaise}
        >
          Next level →
        </button>
      </div>
    </div>
  )
}
