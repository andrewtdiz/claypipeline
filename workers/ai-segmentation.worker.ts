let segmenter: any = null
let currentDevice = 'wasm'
let RawImageClass: any = null

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data

  if (msg.type === 'load') {
    try {
      self.postMessage({ type: 'status', message: `Loading transformers.js...` })

      const { env, pipeline, RawImage } = await import('@huggingface/transformers')
      RawImageClass = RawImage
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

      segmenter = await pipeline('image-segmentation', msg.model, {
        device,
        dtype: 'fp32',
      })

      currentDevice = device
      self.postMessage({ type: 'device', device: currentDevice })
    } catch (e: any) {
      console.error('[segmentation worker] load error:', e)
      // If webgpu failed, try wasm fallback
      if (msg.device === 'auto' || msg.device === 'webgpu') {
        try {
          const { env, pipeline, RawImage } = await import('@huggingface/transformers')
          RawImageClass = RawImage
          env.allowLocalModels = false

          segmenter = await pipeline('image-segmentation', msg.model, {
            device: 'wasm',
            dtype: 'fp32',
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
      if (!segmenter || !RawImageClass) {
        self.postMessage({ type: 'error', message: 'Model not loaded' })
        return
      }

      self.postMessage({ type: 'progress', progress: 0.1 })

      const { imageData: buffer, width, height, params } = msg
      const pixelData = new Uint8ClampedArray(buffer)
      const rawImage = new RawImageClass(pixelData, width, height, 4)

      self.postMessage({ type: 'progress', progress: 0.3 })

      const result = await segmenter(rawImage, {
        threshold: params.threshold ?? 0.5,
      })

      self.postMessage({ type: 'progress', progress: 0.8 })

      // Extract mask and apply alpha to original
      const output = new Uint8ClampedArray(width * height * 4)
      const maskData = result[0]?.mask

      if (maskData) {
        const maskImage = maskData as any
        const maskPixels = maskImage.data as Uint8Array

        for (let i = 0; i < width * height; i++) {
          output[i * 4] = pixelData[i * 4]
          output[i * 4 + 1] = pixelData[i * 4 + 1]
          output[i * 4 + 2] = pixelData[i * 4 + 2]
          const maskVal = maskPixels[i * 4] ?? maskPixels[i] ?? 255
          output[i * 4 + 3] = maskVal
        }
      } else {
        output.set(pixelData)
      }

      self.postMessage({ type: 'progress', progress: 1 })

      const outputBuffer = output.buffer.slice(0)
      self.postMessage(
        { type: 'result', imageData: outputBuffer, width, height },
        // @ts-expect-error transferable
        [outputBuffer],
      )
    } catch (e: any) {
      console.error('[segmentation worker] run error:', e)
      self.postMessage({ type: 'error', message: e.message })
    }
  }
}
