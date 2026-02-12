<script setup lang="ts">
import { usePipelineStore } from '~/stores/pipeline'

const store = usePipelineStore()

const runningNodes = computed(() => {
  const running: { id: string; label: string; progress: number }[] = []
  for (const node of store.nodes) {
    const state = store.nodeStates.get(node.id)
    if (state && (state.status === 'running' || state.status === 'pending')) {
      running.push({
        id: node.id,
        label: (node.label as string) || node.type || node.id,
        progress: state.progress,
      })
    }
  }
  return running
})
</script>

<template>
  <Transition name="fade">
    <div
      v-if="store.isRunning && runningNodes.length > 0"
      class="absolute bottom-4 left-4 bg-gray-900/90 border border-gray-700 rounded-lg p-3 min-w-[200px] z-40 backdrop-blur"
    >
      <div class="text-xs font-semibold text-gray-300 mb-2">Running Pipeline</div>
      <div
        v-for="node in runningNodes"
        :key="node.id"
        class="mb-1.5 last:mb-0"
      >
        <div class="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
          <span>{{ node.label }}</span>
          <span>{{ (node.progress * 100).toFixed(0) }}%</span>
        </div>
        <div class="h-1 bg-gray-800 rounded overflow-hidden">
          <div
            class="h-full bg-gray-500 transition-all duration-300"
            :style="{ width: `${node.progress * 100}%` }"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
