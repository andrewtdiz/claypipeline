<script setup lang="ts">
defineProps<{ keys: string[] }>()
</script>

<template>
  <span class="inline-flex items-center gap-0.5 ml-1.5">
    <kbd
      v-for="key in keys"
      :key="key"
      class="px-1 py-0.5 text-[10px] leading-none rounded bg-white/10 text-white/50 font-sans"
    >
      {{ key }}
    </kbd>
  </span>
</template>
