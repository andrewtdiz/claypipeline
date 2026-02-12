import type { ImageFrame } from './image-frame'

export type NodeStatus = 'idle' | 'pending' | 'running' | 'done' | 'error' | 'cached'

export interface NodeState {
  status: NodeStatus
  progress: number
  error: string | null
  output: ImageFrame | null
  cacheKey: string | null
  deviceUsed?: 'webgpu' | 'wasm' | null
}

export interface ExecutionContext {
  abortSignal: AbortSignal
  gpuDevice: GPUDevice | null
  onProgress: (nodeId: string, progress: number) => void
  onStatus: (nodeId: string, status: NodeStatus, error?: string) => void
}

export function createDefaultNodeState(): NodeState {
  return {
    status: 'idle',
    progress: 0,
    error: null,
    output: null,
    cacheKey: null,
    deviceUsed: null,
  }
}
