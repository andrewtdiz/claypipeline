<script setup lang="ts">
import { useResizablePanel } from '~/composables/useResizablePanel'

const props = withDefaults(defineProps<{
  panelKey: string
  side: 'left' | 'right'
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  collapseThreshold?: number
  title?: string
}>(), {
  defaultWidth: 240,
  minWidth: 180,
  maxWidth: 280,
  collapseThreshold: 60,
  title: '',
})

const { width, isCollapsed, isDragging, handleMouseDown, toggle } = useResizablePanel({
  key: props.panelKey,
  side: props.side,
  defaultWidth: props.defaultWidth,
  minWidth: props.minWidth,
  maxWidth: props.maxWidth,
  collapseThreshold: props.collapseThreshold,
})

defineExpose({ isDragging, isCollapsed, toggle })
</script>

<template>
  <!-- Collapsed strip -->
  <div
    v-if="isCollapsed"
    class="w-5 bg-gray-900 flex-shrink-0 flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
    :class="side === 'right' ? 'border-l border-gray-800' : 'border-r border-gray-800'"
    @click="toggle"
  >
    <span class="text-gray-500 text-xs select-none">
      {{ side === 'right' ? '\u25C0' : '\u25B6' }}
    </span>
  </div>

  <!-- Expanded panel -->
  <div
    v-else
    class="relative flex-shrink-0 bg-gray-900 flex"
    :class="side === 'right' ? 'border-l border-gray-800 flex-row-reverse' : 'border-r border-gray-800 flex-row'"
    :style="{ width: `${width}px` }"
  >
    <!-- Drag handle -->
    <div
      class="absolute top-0 bottom-0 w-1 z-10 cursor-col-resize hover:bg-blue-500/40 transition-colors"
      :class="[
        side === 'right' ? '-left-0.5' : '-right-0.5',
        isDragging ? 'bg-blue-500/40' : '',
      ]"
      @mousedown="handleMouseDown"
    />

    <!-- Content -->
    <div class="flex-1 min-w-0 overflow-hidden">
      <slot />
    </div>
  </div>
</template>
