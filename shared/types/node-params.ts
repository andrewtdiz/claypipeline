export interface InputNodeParams {
  maxSize: number
  fit: 'contain' | 'cover' | 'fill'
}

export interface OutputNodeParams {
  format: 'png' | 'jpeg' | 'webp'
  quality: number
}

export interface RemoveBgParams {
  threshold: number
  device: 'webgpu' | 'wasm' | 'auto'
}

export interface UpscaleParams {
  scale: 2
  tileSize: number
  device: 'webgpu' | 'wasm' | 'auto'
}

export interface NormalizeParams {
  size: number
  padding: number
}

export interface OutlineParams {
  thickness: number
  color: string
  opacity: number
  quality: 'low' | 'medium' | 'high'
  position: 'outside' | 'center' | 'inside'
  threshold: number
}

export type NodeParamsMap = {
  'input': InputNodeParams
  'output': OutputNodeParams
  'remove-bg': RemoveBgParams
  'normalize': NormalizeParams
  'upscale': UpscaleParams
  'outline': OutlineParams
}

export const DEFAULT_PARAMS: NodeParamsMap = {
  'input': { maxSize: 2048, fit: 'contain' },
  'output': { format: 'png', quality: 0.92 },
  'remove-bg': { threshold: 0.5, device: 'auto' },
  'normalize': { size: 1024, padding: 16 },
  'upscale': { scale: 2, tileSize: 512, device: 'auto' },
  'outline': { thickness: 4, color: '#ffffff', opacity: 1, quality: 'medium', position: 'outside', threshold: 0 },
}
