<script setup lang="ts">
import { usePipelineStore } from '~/stores/pipeline'

const store = usePipelineStore()

onMounted(() => {
  store.loadDefaultPipeline()
})
</script>

<template>
  <div class="h-screen flex flex-col">
    <TopBar />
    <div class="flex-1 flex min-h-0">
      <div class="flex-1 relative">
        <PipelineCanvas />
        <ProgressOverlay />
      </div>
      <NodeInspector />
    </div>
  </div>
</template>
