<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { usePipelineStore } from '~/stores/pipeline'

const props = defineProps<{
  id: string
  label: string
  hasInput?: boolean
  hasOutput?: boolean
  hidePreview?: boolean
  color?: string
  icon?: Component
}>()

const store = usePipelineStore()
const state = computed(() => store.getNodeState(props.id))

const statusColor = computed(() => {
  switch (state.value.status) {
    case 'running': return '#f59e0b'
    case 'done': return '#22c55e'
    case 'cached': return '#22c55e'
    case 'error': return '#ef4444'
    case 'pending': return '#6b7280'
    default: return '#6b7280'
  }
})

const isSelected = computed(() => store.selectedNodeId === props.id)

const borderColor = computed(() => {
  if (isSelected.value) return 'border-[#535DFF]'
  if (state.value.status === 'error') return 'border-red-500'
  return 'border-gray-700'
})

// Output preview thumbnail
const previewUrl = ref<string | null>(null)

watch(() => state.value.output, async (output) => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  if (output?.bitmap) {
    const canvas = new OffscreenCanvas(output.bitmap.width, output.bitmap.height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(output.bitmap, 0, 0)
    const blob = await canvas.convertToBlob({ type: 'image/png' })
    previewUrl.value = URL.createObjectURL(blob)
  } else {
    previewUrl.value = null
  }
}, { immediate: true })

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <div
    :class="['relative rounded-lg border shadow-lg min-w-[180px] select-none bg-gray-900', borderColor]"
  >
    <!-- Header -->
    <div
      class="flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs font-semibold tracking-wide text-white"
      :style="{ borderBottom: '1px solid #333' }"
    >
      <span
        class="w-2 h-2 rounded-full flex-shrink-0"
        :style="{ backgroundColor: statusColor }"
      />
      <span class="truncate flex-1 text-left">{{ label }}</span>
      <span
        v-if="state.deviceUsed"
        class="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400"
      >
        {{ state.deviceUsed }}
      </span>
      <component
        :is="icon"
        v-if="icon"
        class="w-3.5 h-3.5 text-gray-500 flex-shrink-0"
      />
    </div>

    <!-- Output preview -->
    <div v-if="!hidePreview" class="px-3 pt-3">
      <img
        v-if="previewUrl"
        :src="previewUrl"
        class="max-w-[150px] rounded border border-gray-700 checkerboard-bg"
        alt="Step result"
      >
      <div
        v-else
        class="w-[150px] h-[150px] rounded border border-gray-700 checkerboard-bg flex items-center justify-center"
      >
        <span class="text-[10px] text-gray-600">No output</span>
      </div>
    </div>

    <!-- Body -->
    <div class="p-3">
      <slot />
    </div>

    <!-- Progress bar -->
    <div
      v-if="state.status === 'running' && state.progress > 0"
      class="h-1 bg-gray-800 rounded-b-lg overflow-hidden"
    >
      <div
        class="h-full bg-gray-500 transition-all duration-300"
        :style="{ width: `${state.progress * 100}%` }"
      />
    </div>

    <!-- Handles -->
    <Handle
      v-if="hasInput"
      id="input"
      type="target"
      :position="Position.Left"
    />
    <Handle
      v-if="hasOutput"
      id="output"
      type="source"
      :position="Position.Right"
    />
  </div>
</template>

<style scoped>
.checkerboard-bg {
  background-image:
    linear-gradient(45deg, #1a1a1a 25%, transparent 25%),
    linear-gradient(-45deg, #1a1a1a 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #1a1a1a 75%),
    linear-gradient(-45deg, transparent 75%, #1a1a1a 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
  background-color: #111;
}
</style>
