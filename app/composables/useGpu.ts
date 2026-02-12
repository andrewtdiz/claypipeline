const gpuState = {
  device: null as GPUDevice | null,
  supported: false,
  error: null as string | null,
  initialized: false,
}

export function useGpu() {
  const device = ref<GPUDevice | null>(gpuState.device)
  const supported = ref(gpuState.supported)
  const error = ref<string | null>(gpuState.error)

  async function init() {
    if (gpuState.initialized) {
      device.value = gpuState.device
      supported.value = gpuState.supported
      error.value = gpuState.error
      return
    }

    try {
      if (!navigator.gpu) {
        throw new Error('WebGPU not available in this browser')
      }
      const adapter = await navigator.gpu.requestAdapter()
      if (!adapter) {
        throw new Error('No WebGPU adapter found')
      }
      const gpuDevice = await adapter.requestDevice()
      gpuDevice.lost.then((info) => {
        console.error('WebGPU device lost:', info.message)
        gpuState.device = null
        gpuState.supported = false
        gpuState.error = `Device lost: ${info.message}`
        device.value = null
        supported.value = false
        error.value = gpuState.error
      })
      gpuState.device = gpuDevice
      gpuState.supported = true
      gpuState.error = null
      device.value = gpuDevice
      supported.value = true
    } catch (e: any) {
      gpuState.supported = false
      gpuState.error = e.message
      error.value = e.message
      supported.value = false
    }
    gpuState.initialized = true
  }

  return { device, supported, error, init }
}
