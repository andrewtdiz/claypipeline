<script setup lang="ts">
import { PhotoIcon } from '@heroicons/vue/20/solid'
import BaseNode from '~/components/nodes/BaseNode.vue'
import { usePipelineStore } from '~/stores/pipeline'
import { fileToBitmap, resizeBitmap } from '~/utils/image'
import type { ImageFrame } from '~~/shared/types/image-frame'

const props = defineProps<{ id: string; label?: string; data: { params: Record<string, unknown> } }>()

const store = usePipelineStore()
const isDragging = ref(false)

const frame = computed(() => store.inputImages.get(props.id) || null)

async function handleFile(file: File) {
  if (!file.type.startsWith('image/')) return
  const bitmap = await fileToBitmap(file)
  const maxSize = (props.data.params.maxSize as number) || 2048
  const fit = (props.data.params.fit as 'contain' | 'cover' | 'fill') || 'contain'
  const resized = await resizeBitmap(bitmap, maxSize, fit)
  const imageFrame: ImageFrame = {
    bitmap: resized,
    width: resized.width,
    height: resized.height,
    revision: Date.now(),
  }
  store.setInputImage(props.id, imageFrame)
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function openFilePicker() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file) handleFile(file)
  }
  input.click()
}
</script>

<template>
  <BaseNode :id="id" :label="label || 'Input'" :has-output="true" :icon="PhotoIcon">
    <div
      :class="[
        'border-2 border-dashed rounded-md p-3 text-center cursor-pointer transition-colors min-h-[80px] flex items-center justify-center',
        isDragging ? 'border-gray-400 bg-gray-400/10' : 'border-gray-600 hover:border-gray-500',
      ]"
      @drop="onDrop"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @click="openFilePicker"
    >
      <span class="text-gray-500 text-xs">
        {{ frame ? `${frame.width} × ${frame.height}` : 'Drop image or click' }}
      </span>
    </div>
  </BaseNode>
</template>
