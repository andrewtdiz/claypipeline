<script setup lang="ts">
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import { markRaw } from 'vue'
import { nanoid } from 'nanoid'
import { usePipelineStore } from '~/stores/pipeline'
import type { NodeType } from '~~/shared/types/pipeline'

import InputNode from '~/components/nodes/InputNode.vue'
import OutputNode from '~/components/nodes/OutputNode.vue'
import RemoveBgNode from '~/components/nodes/RemoveBgNode.vue'
import UpscaleNode from '~/components/nodes/UpscaleNode.vue'
import NormalizeNode from '~/components/nodes/NormalizeNode.vue'
import OutlineNode from '~/components/nodes/OutlineNode.vue'

const nodeTypes = {
  'input': markRaw(InputNode),
  'output': markRaw(OutputNode),
  'remove-bg': markRaw(RemoveBgNode),
  'normalize': markRaw(NormalizeNode),
  'upscale': markRaw(UpscaleNode),
  'outline': markRaw(OutlineNode),
}

const store = usePipelineStore()

const { onNodeClick, onPaneClick, onConnect, project } = useVueFlow()

// Sync selection
onNodeClick(({ node }) => {
  store.selectNode(node.id)
})

onPaneClick(() => {
  store.selectNode(null)
})

// Handle new connections
onConnect((connection) => {
  store.edges.push({
    id: nanoid(8),
    source: connection.source,
    sourceHandle: connection.sourceHandle || 'output',
    target: connection.target,
    targetHandle: connection.targetHandle || 'input',
  } as any)
  store.isDirty = true
})

// Context menu for adding nodes
const contextMenu = ref<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false })

const addableNodes: { type: NodeType; label: string }[] = [
  { type: 'remove-bg', label: 'Remove BG' },
  { type: 'normalize', label: 'Normalize' },
  { type: 'outline', label: 'Outline' },
  { type: 'upscale', label: 'Upscale 2x' },
]

function onPaneContextMenu(event: MouseEvent) {
  event.preventDefault()
  contextMenu.value = { x: event.clientX, y: event.clientY, show: true }
}

function addNodeFromMenu(type: NodeType) {
  const canvasPos = project({ x: contextMenu.value.x, y: contextMenu.value.y })
  store.addNode(type, canvasPos)
  contextMenu.value.show = false
}

function closeContextMenu() {
  contextMenu.value.show = false
}
</script>

<template>
  <div class="w-full h-full" @click="closeContextMenu">
    <VueFlow
      v-model:nodes="store.nodes"
      v-model:edges="store.edges"
      :node-types="nodeTypes"
      :default-viewport="{ x: 0, y: 0, zoom: 0.85 }"
      :snap-to-grid="true"
      :snap-grid="[20, 20]"
      :min-zoom="0.2"
      :max-zoom="2"
      fit-view-on-init
      @pane-contextmenu="onPaneContextMenu"
    >
      <Background :gap="20" :size="1" pattern-color="#222" />
      <Controls />
      <MiniMap
        mask-color="rgba(0, 0, 0, 0.6)"
        node-color="#444"
        node-stroke-color="transparent"
      />
    </VueFlow>

    <!-- Context menu -->
    <Teleport to="body">
      <div
        v-if="contextMenu.show"
        class="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px]"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      >
        <div class="px-3 py-1.5 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
          Add Node
        </div>
        <button
          v-for="node in addableNodes"
          :key="node.type"
          class="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          @click.stop="addNodeFromMenu(node.type)"
        >
          {{ node.label }}
        </button>
      </div>
    </Teleport>
  </div>
</template>
