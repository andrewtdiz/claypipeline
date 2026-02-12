<script setup lang="ts">
export interface MenuItem {
  label: string
  icon?: Component
  shortcut?: string[]
  action?: () => void
  children?: MenuItem[]
  separator?: boolean
}

defineProps<{
  label: string
  items: MenuItem[]
}>()

const uid = Symbol()
const open = ref(false)
const expandedIndex = ref<number | null>(null)

function toggle() {
  if (open.value) {
    close()
  } else {
    // Close all other dropdowns first
    window.dispatchEvent(new CustomEvent('dropdown:close', { detail: uid }))
    open.value = true
  }
  expandedIndex.value = null
}

function close() {
  open.value = false
  expandedIndex.value = null
}

function onDropdownClose(e: Event) {
  const detail = (e as CustomEvent).detail
  if (detail !== uid) close()
}

function handleItem(item: MenuItem) {
  if (item.children) return
  item.action?.()
  close()
}

function onMouseEnter(index: number, item: MenuItem) {
  if (item.children) {
    expandedIndex.value = index
  } else {
    expandedIndex.value = null
  }
}

onMounted(() => {
  window.addEventListener('click', close)
  window.addEventListener('dropdown:close', onDropdownClose)
})
onUnmounted(() => {
  window.removeEventListener('click', close)
  window.removeEventListener('dropdown:close', onDropdownClose)
})
</script>

<template>
  <div class="relative">
    <button
      class="px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
      @click.stop="toggle"
    >
      {{ label }}
    </button>

    <div
      v-if="open"
      class="absolute top-full left-0 mt-1 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[180px]"
      @click.stop
    >
      <template v-for="(item, i) in items" :key="i">
        <div v-if="item.separator" class="h-px bg-gray-700 my-1" />
        <div
          v-else
          class="relative"
          @mouseenter="onMouseEnter(i, item)"
        >
          <button
            class="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
            @click="handleItem(item)"
          >
            <component
              :is="item.icon"
              v-if="item.icon"
              class="w-3.5 h-3.5 text-gray-500 flex-shrink-0"
            />
            <span v-else class="w-3.5 flex-shrink-0" />
            <span class="flex-1">{{ item.label }}</span>
            <CommandShortcut v-if="item.shortcut" :keys="item.shortcut" />
            <svg
              v-if="item.children"
              class="w-3 h-3 text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <!-- Submenu -->
          <div
            v-if="item.children && expandedIndex === i"
            class="absolute left-full top-0 ml-0.5 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px]"
          >
            <template v-for="(child, j) in item.children" :key="j">
              <div v-if="child.separator" class="h-px bg-gray-700 my-1" />
              <button
                v-else
                class="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
                @click="handleItem(child)"
              >
                <component
                  :is="child.icon"
                  v-if="child.icon"
                  class="w-3.5 h-3.5 text-gray-500 flex-shrink-0"
                />
                <span v-else class="w-3.5 flex-shrink-0" />
                <span class="flex-1">{{ child.label }}</span>
                <CommandShortcut v-if="child.shortcut" :keys="child.shortcut" />
              </button>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
