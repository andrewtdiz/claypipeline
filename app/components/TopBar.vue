<script setup lang="ts">
import { nanoid } from 'nanoid'
import {
  DocumentPlusIcon,
  FolderOpenIcon,
  ArrowDownTrayIcon,
  DocumentDuplicateIcon,
  ScissorsIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  PaintBrushIcon,
} from '@heroicons/vue/20/solid'
import type { NodeType } from '~~/shared/types/pipeline'
import { usePipelineStore } from '~/stores/pipeline'
import { useFileIo } from '~/composables/useFileIo'
import { usePipelineRunner } from '~/composables/usePipelineRunner'
import { DEFAULT_PARAMS } from '~~/shared/types/node-params'
import type { PipelineDefinition } from '~~/shared/types/pipeline'
import type { MenuItem } from '~/components/DropdownMenu.vue'

const store = usePipelineStore()
const { savePipeline, savePipelineAs, openPipeline, newPipeline } = useFileIo()
const { run: runPipeline, stop, runError } = usePipelineRunner()

async function run() {
  try {
    await runPipeline()
  } catch (e: any) {
    console.error('Pipeline run error:', e)
  }
}

const gpuSupported = ref(false)
onMounted(async () => {
  gpuSupported.value = !!navigator.gpu && !!(await navigator.gpu.requestAdapter())
})

// Presets
function buildOutlinePreset(): PipelineDefinition {
  const inputId = nanoid(8)
  const removeBgId = nanoid(8)
  const normalizeId = nanoid(8)
  const outlineId = nanoid(8)
  const outputId = nanoid(8)
  return {
    version: 1,
    nodes: [
      { id: inputId, type: 'input', position: { x: 60, y: 200 }, params: { ...DEFAULT_PARAMS['input'] }, label: 'Image Input' },
      { id: removeBgId, type: 'remove-bg', position: { x: 360, y: 200 }, params: { ...DEFAULT_PARAMS['remove-bg'] }, label: 'Remove BG' },
      { id: normalizeId, type: 'normalize', position: { x: 660, y: 200 }, params: { ...DEFAULT_PARAMS['normalize'] }, label: 'Normalize' },
      { id: outlineId, type: 'outline', position: { x: 960, y: 200 }, params: { thickness: 22, color: '#ffffff', opacity: 1, quality: 'high', position: 'outside', threshold: 2.5 }, label: 'Outline' },
      { id: outputId, type: 'output', position: { x: 1260, y: 200 }, params: { ...DEFAULT_PARAMS['output'] }, label: 'Output' },
    ],
    edges: [
      { id: nanoid(8), source: inputId, sourceHandle: 'output', target: removeBgId, targetHandle: 'input' },
      { id: nanoid(8), source: removeBgId, sourceHandle: 'output', target: normalizeId, targetHandle: 'input' },
      { id: nanoid(8), source: normalizeId, sourceHandle: 'output', target: outlineId, targetHandle: 'input' },
      { id: nanoid(8), source: outlineId, sourceHandle: 'output', target: outputId, targetHandle: 'input' },
    ],
  }
}

function loadPreset(build: () => PipelineDefinition) {
  store.loadPipeline(build())
  store.fileHandle = null
  store.fileName = null
}

const fileMenuItems = computed<MenuItem[]>(() => [
  { label: 'New', icon: DocumentPlusIcon, shortcut: ['⌘', 'N'], action: newPipeline },
  { label: 'Open...', icon: FolderOpenIcon, shortcut: ['⌘', 'O'], action: openPipeline },
  { separator: true, label: '' },
  { label: 'Save', icon: ArrowDownTrayIcon, shortcut: ['⌘', 'S'], action: savePipeline },
  { label: 'Save As...', icon: DocumentDuplicateIcon, shortcut: ['⇧', '⌘', 'S'], action: savePipelineAs },
])

const presetMenuItems = computed<MenuItem[]>(() => [
  { label: 'Outline', action: () => loadPreset(buildOutlinePreset) },
])

function addNodeAtCenter(type: NodeType) {
  // Place below and to the right of the rightmost node to avoid overlaps
  let maxX = 0
  let maxY = 0
  for (const n of store.nodes) {
    if (n.position.x > maxX) maxX = n.position.x
    if (n.position.y > maxY) maxY = n.position.y
  }
  store.addNode(type, { x: maxX + 300, y: maxY })
}

const addNodeItems = computed<MenuItem[]>(() => [
  { label: 'Remove BG', icon: ScissorsIcon, action: () => addNodeAtCenter('remove-bg') },
  { label: 'Normalize', icon: ArrowsPointingInIcon, action: () => addNodeAtCenter('normalize') },
  { label: 'Outline', icon: PaintBrushIcon, action: () => addNodeAtCenter('outline') },
  { label: 'Upscale 2x', icon: ArrowsPointingOutIcon, action: () => addNodeAtCenter('upscale') },
])

function handleKeyboard(e: KeyboardEvent) {
  const mod = e.metaKey || e.ctrlKey
  if (mod && e.key === 's') {
    e.preventDefault()
    if (e.shiftKey) savePipelineAs()
    else savePipeline()
  }
  if (mod && e.key === 'o') {
    e.preventDefault()
    openPipeline()
  }
  if (mod && e.key === 'Enter') {
    e.preventDefault()
    if (store.isRunning) stop()
    else run()
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (store.selectedNodeId && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as Element)?.tagName)) {
      store.removeNode(store.selectedNodeId)
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyboard)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboard)
})
</script>

<template>
  <div class="h-11 bg-gray-900 border-b border-gray-800 flex items-center px-3 gap-2 flex-shrink-0">
    <!-- Logo / Title -->
    <span class="text-sm font-semibold text-gray-300 mr-4">
      PipeMagic
    </span>

    <!-- File menu -->
    <DropdownMenu label="File" :items="fileMenuItems" />
    <DropdownMenu label="Add Node" :items="addNodeItems" />
    <DropdownMenu label="Presets" :items="presetMenuItems" />

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Status indicators -->
    <span
      v-if="store.fileName"
      class="text-[10px] text-gray-500 max-w-[200px] truncate"
    >
      {{ store.fileName }}
    </span>
    <!-- Run error -->
    <span
      v-if="runError"
      class="text-[10px] text-red-400 max-w-[300px] truncate px-2"
      :title="runError"
    >
      {{ runError }}
    </span>
    <span
      class="text-[10px] px-1.5 py-0.5 rounded"
      :class="gpuSupported ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'"
    >
      {{ gpuSupported ? 'WebGPU' : 'WASM' }}
    </span>

    <!-- Run/Stop -->
    <button
      v-if="!store.isRunning"
      class="flex items-center px-3 py-1 text-xs font-medium rounded bg-gray-600 hover:bg-gray-500 text-white transition-colors"
      @click="run"
    >
      Run Pipeline
      <CommandShortcut :keys="['⌘', '↵']" />
    </button>
    <button
      v-else
      class="px-3 py-1 text-xs font-medium rounded bg-red-600 hover:bg-red-500 text-white transition-colors"
      @click="stop"
    >
      Stop
    </button>
  </div>
</template>
