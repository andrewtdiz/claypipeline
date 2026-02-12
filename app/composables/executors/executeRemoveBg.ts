import type { ExecutionContext } from '~~/shared/types/execution'
import type { ImageFrame } from '~~/shared/types/image-frame'
import { bitmapToImageData, imageDataToBitmap } from '~/utils/image'

let segmenter: any = null
let loadingPromise: Promise<any> | null = null

async function getSegmenter(device: string, onStatus?: (msg: string) => void) {
  if (segmenter) return segmenter
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    onStatus?.('Loading transformers.js...')
    const { env, pipeline } = await import('@huggingface/transformers')
    env.allowLocalModels = false

    let actualDevice = device
    if (actualDevice === 'auto') {
      try {
        if (navigator.gpu) {
          const adapter = await navigator.gpu.requestAdapter()
          actualDevice = adapter ? 'webgpu' : 'wasm'
        } else {
          actualDevice = 'wasm'
        }
      } catch {
        actualDevice = 'wasm'
      }
    }

    onStatus?.(`Loading RMBG-1.4 on ${actualDevice}...`)
    try {
      segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
        device: actualDevice as 'webgpu' | 'wasm',
        dtype: 'fp32',
      })
    } catch (e) {
      if (actualDevice === 'webgpu') {
        onStatus?.('WebGPU failed, falling back to WASM...')
        segmenter = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
          device: 'wasm',
          dtype: 'fp32',
        })
      } else {
        throw e
      }
    }
    return segmenter
  })()

  try {
    const result = await loadingPromise
    return result
  } catch (e) {
    loadingPromise = null
    throw e
  }
}

export async function executeRemoveBg(
  ctx: ExecutionContext,
  inputs: ImageFrame[],
  params: Record<string, unknown>,
): Promise<ImageFrame> {
  const input = inputs[0]
  if (!input) throw new Error('No input image')

  const device = (params.device as string) || 'auto'

  ctx.onProgress('', 0.05)
  const model = await getSegmenter(device, (msg) => console.log('[remove-bg]', msg))
  ctx.onProgress('', 0.2)

  if (ctx.abortSignal.aborted) throw new DOMException('Aborted', 'AbortError')

  const imageData = bitmapToImageData(input.bitmap)
  const { RawImage } = await import('@huggingface/transformers')
  const rawImage = new RawImage(new Uint8ClampedArray(imageData.data), input.width, input.height, 4)

  ctx.onProgress('', 0.3)

  const result = await model(rawImage, {
    threshold: (params.threshold as number) ?? 0.5,
  })

  ctx.onProgress('', 0.8)

  // Extract mask and apply alpha
  const { width, height } = input
  const src = imageData.data
  const output = new Uint8ClampedArray(width * height * 4)
  const maskData = result[0]?.mask

  if (maskData) {
    const maskPixels = maskData.data as Uint8Array
    const maskChannels = maskData.channels || 1
    for (let i = 0; i < width * height; i++) {
      output[i * 4] = src[i * 4]
      output[i * 4 + 1] = src[i * 4 + 1]
      output[i * 4 + 2] = src[i * 4 + 2]
      // Read mask value — could be 1-channel or 4-channel
      const maskVal = maskChannels >= 4 ? maskPixels[i * maskChannels] : maskPixels[i]
      output[i * 4 + 3] = maskVal ?? 255
    }
  } else {
    output.set(src)
  }

  ctx.onProgress('', 1)

  const outImageData = new ImageData(output, width, height)
  const bitmap = await imageDataToBitmap(outImageData)
  return {
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
    revision: Date.now(),
  }
}
