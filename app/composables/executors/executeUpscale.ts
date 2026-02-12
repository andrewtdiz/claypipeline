import type { ExecutionContext } from '~~/shared/types/execution'
import type { ImageFrame } from '~~/shared/types/image-frame'
import { bitmapToImageData, imageDataToBitmap } from '~/utils/image'

let upscaler: any = null
let loadingPromise: Promise<any> | null = null

async function getUpscaler(device: string, onStatus?: (msg: string) => void) {
  if (upscaler) return upscaler
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

    onStatus?.(`Loading Swin2SR on ${actualDevice}...`)
    try {
      upscaler = await pipeline('image-to-image', 'Xenova/swin2SR-classical-sr-x2-64', {
        device: actualDevice as 'webgpu' | 'wasm',
      })
    } catch (e) {
      if (actualDevice === 'webgpu') {
        onStatus?.('WebGPU failed, falling back to WASM...')
        upscaler = await pipeline('image-to-image', 'Xenova/swin2SR-classical-sr-x2-64', {
          device: 'wasm',
        })
      } else {
        throw e
      }
    }
    return upscaler
  })()

  try {
    const result = await loadingPromise
    return result
  } catch (e) {
    loadingPromise = null
    throw e
  }
}

export async function executeUpscale(
  ctx: ExecutionContext,
  inputs: ImageFrame[],
  params: Record<string, unknown>,
): Promise<ImageFrame> {
  const input = inputs[0]
  if (!input) throw new Error('No input image')

  const device = (params.device as string) || 'auto'

  ctx.onProgress('', 0.05)
  const model = await getUpscaler(device, (msg) => console.log('[upscale]', msg))
  ctx.onProgress('', 0.2)

  if (ctx.abortSignal.aborted) throw new DOMException('Aborted', 'AbortError')

  const imageData = bitmapToImageData(input.bitmap)
  const { RawImage } = await import('@huggingface/transformers')
  const rawImage = new RawImage(new Uint8ClampedArray(imageData.data), input.width, input.height, 4)

  ctx.onProgress('', 0.3)

  const result = await model(rawImage) as any

  ctx.onProgress('', 0.9)

  const outWidth = result.width
  const outHeight = result.height
  const outData = result.data as Uint8Array

  let outImageData: ImageData
  if (result.channels === 3) {
    const rgba = new Uint8ClampedArray(outWidth * outHeight * 4)
    for (let i = 0; i < outWidth * outHeight; i++) {
      rgba[i * 4] = outData[i * 3]
      rgba[i * 4 + 1] = outData[i * 3 + 1]
      rgba[i * 4 + 2] = outData[i * 3 + 2]
      rgba[i * 4 + 3] = 255
    }
    outImageData = new ImageData(rgba, outWidth, outHeight)
  } else {
    outImageData = new ImageData(new Uint8ClampedArray(outData), outWidth, outHeight)
  }

  ctx.onProgress('', 1)

  const bitmap = await imageDataToBitmap(outImageData)
  return {
    bitmap,
    width: bitmap.width,
    height: bitmap.height,
    revision: Date.now(),
  }
}
