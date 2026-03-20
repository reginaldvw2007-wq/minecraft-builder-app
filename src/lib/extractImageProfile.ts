export type CaptureProfile = {
  width: number
  height: number
  aspectRatio: number
  brightness: number
  contrast: number
  saturation: number
  warmth: number
  edgeDensity: number
  topBrightness: number
  bottomBrightness: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read the captured image.'))
    image.decoding = 'async'
    image.src = src
  })
}

export async function extractImageProfile(file: File): Promise<CaptureProfile | undefined> {
  if (typeof document === 'undefined') {
    return undefined
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(objectUrl)
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })

    if (!context) {
      return undefined
    }

    const sampleWidth = 40
    const sampleHeight = clamp(
      Math.round(sampleWidth / Math.max(image.width / Math.max(image.height, 1), 0.35)),
      24,
      48,
    )

    canvas.width = sampleWidth
    canvas.height = sampleHeight
    context.drawImage(image, 0, 0, sampleWidth, sampleHeight)

    const { data } = context.getImageData(0, 0, sampleWidth, sampleHeight)

    let brightnessTotal = 0
    let brightnessSquareTotal = 0
    let saturationTotal = 0
    let warmthTotal = 0
    let edgeHits = 0
    let topBrightnessTotal = 0
    let bottomBrightnessTotal = 0
    let topSampleCount = 0
    let bottomSampleCount = 0
    const brightnessMap = Array.from({ length: sampleHeight }, () => Array(sampleWidth).fill(0))

    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const index = (y * sampleWidth + x) * 4
        const red = data[index] / 255
        const green = data[index + 1] / 255
        const blue = data[index + 2] / 255
        const brightness = red * 0.2126 + green * 0.7152 + blue * 0.0722
        const maxChannel = Math.max(red, green, blue)
        const minChannel = Math.min(red, green, blue)
        const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel
        const warmth = red - blue

        brightnessMap[y][x] = brightness
        brightnessTotal += brightness
        brightnessSquareTotal += brightness * brightness
        saturationTotal += saturation
        warmthTotal += warmth

        if (y < sampleHeight / 3) {
          topBrightnessTotal += brightness
          topSampleCount += 1
        }

        if (y >= sampleHeight * (2 / 3)) {
          bottomBrightnessTotal += brightness
          bottomSampleCount += 1
        }
      }
    }

    for (let y = 1; y < sampleHeight; y += 1) {
      for (let x = 1; x < sampleWidth; x += 1) {
        const currentBrightness = brightnessMap[y][x]
        const horizontalDelta = Math.abs(currentBrightness - brightnessMap[y][x - 1])
        const verticalDelta = Math.abs(currentBrightness - brightnessMap[y - 1][x])

        if (horizontalDelta + verticalDelta > 0.18) {
          edgeHits += 1
        }
      }
    }

    const pixelCount = sampleWidth * sampleHeight
    const averageBrightness = brightnessTotal / pixelCount
    const contrast = Math.sqrt(
      Math.max(brightnessSquareTotal / pixelCount - averageBrightness * averageBrightness, 0),
    )

    return {
      width: image.width,
      height: image.height,
      aspectRatio: image.width / Math.max(image.height, 1),
      brightness: averageBrightness,
      contrast,
      saturation: saturationTotal / pixelCount,
      warmth: warmthTotal / pixelCount,
      edgeDensity: edgeHits / Math.max((sampleWidth - 1) * (sampleHeight - 1), 1),
      topBrightness: topBrightnessTotal / Math.max(topSampleCount, 1),
      bottomBrightness: bottomBrightnessTotal / Math.max(bottomSampleCount, 1),
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
