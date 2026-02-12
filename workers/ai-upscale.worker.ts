let upscaler: any = null
let currentDevice = 'wasm'

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data

  if (msg.type === 'load') {
    try {
      self.postMessage({ type: 'status', message: `Loading transformers.js...` })

      const { env, pipeline } = await import('@huggingface/transformers')
      env.allowLocalModels = false

      self.postMessage({ type: 'status', message: `Loading model ${msg.model}...` })

      let device = msg.device
      if (device === 'auto') {
        try {
          if (typeof navigator !== 'undefined' && (navigator as any).gpu) {
            const adapter = await (navigator as any).gpu.requestAdapter()
            device = adapter ? 'webgpu' : 'wasm'
          } else {
            device = 'wasm'
          }
        } catch {
          device = 'wasm'
        }
      }

      upscaler = await pipeline('image-to-image', msg.model, {
        device,
      })

      currentDevice = device
      self.postMessage({ type: 'device', device: currentDevice })
    } catch (e: any) {
      console.error('[upscale worker] load error:', e)
      if (msg.device === 'auto' || msg.device === 'webgpu') {
        try {
          const { env, pipeline } = await import('@huggingface/transformers')
          env.allowLocalModels = false

          upscaler = await pipeline('image-to-image', msg.model, {
            device: 'wasm',
          })
          currentDevice = 'wasm'
          self.postMessage({ type: 'device', device: 'wasm' })
          return
        } catch (fallbackErr: any) {
          self.postMessage({ type: 'error', message: fallbackErr.message })
          return
        }
      }
      self.postMessage({ type: 'error', message: e.message })
    }
  }

  if (msg.type === 'run') {
    try {
      if (!upscaler) {
        self.postMessage({ type: 'error', message: 'Model not loaded' })
        return
      }

      const { imageData: buffer, width, height } = msg
      const pixelData = new Uint8ClampedArray(buffer)

      const { RawImage } = await import('@huggingface/transformers')
      const rawImage = new RawImage(pixelData, width, height, 4)

      self.postMessage({ type: 'progress', progress: 0.2 })

      const result = await upscaler(rawImage) as any

      self.postMessage({ type: 'progress', progress: 0.9 })

      const outWidth = result.width
      const outHeight = result.height
      const outData = result.data as Uint8Array

      let outputBuffer: ArrayBuffer
      if (result.channels === 3) {
        const rgba = new Uint8ClampedArray(outWidth * outHeight * 4)
        for (let i = 0; i < outWidth * outHeight; i++) {
          rgba[i * 4] = outData[i * 3]
          rgba[i * 4 + 1] = outData[i * 3 + 1]
          rgba[i * 4 + 2] = outData[i * 3 + 2]
          rgba[i * 4 + 3] = 255
        }
        outputBuffer = rgba.buffer.slice(0)
      } else {
        outputBuffer = outData.buffer.slice(0)
      }

      self.postMessage({ type: 'progress', progress: 1 })
      self.postMessage(
        { type: 'result', imageData: outputBuffer, width: outWidth, height: outHeight },
        // @ts-expect-error transferable
        [outputBuffer],
      )
    } catch (e: any) {
      console.error('[upscale worker] run error:', e)
      self.postMessage({ type: 'error', message: e.message })
    }
  }
}
