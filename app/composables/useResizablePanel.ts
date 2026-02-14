interface ResizablePanelOptions {
  key: string
  side: 'left' | 'right'
  defaultWidth: number
  minWidth?: number
  maxWidth?: number
  collapseThreshold?: number
}

interface PersistedState {
  width: number
  collapsed: boolean
}

const STORAGE_PREFIX = 'panel:'

function loadState(key: string): PersistedState | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveState(key: string, state: PersistedState) {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state))
}

export function useResizablePanel(options: ResizablePanelOptions) {
  const {
    key,
    side,
    defaultWidth,
    minWidth = 180,
    maxWidth = 280,
    collapseThreshold = 60,
  } = options

  const saved = loadState(key)
  const width = ref(saved?.width ?? defaultWidth)
  const isCollapsed = ref(saved?.collapsed ?? false)
  const isDragging = ref(false)

  let widthBeforeCollapse = width.value

  function persist() {
    saveState(key, { width: width.value, collapsed: isCollapsed.value })
  }

  function toggle() {
    if (isCollapsed.value) {
      isCollapsed.value = false
      width.value = widthBeforeCollapse >= minWidth ? widthBeforeCollapse : defaultWidth
    } else {
      widthBeforeCollapse = width.value
      isCollapsed.value = true
    }
    persist()
  }

  function handleMouseDown(e: MouseEvent) {
    e.preventDefault()
    isDragging.value = true
    const startX = e.clientX
    const startWidth = width.value
    document.body.style.cursor = 'col-resize'

    function onMouseMove(ev: MouseEvent) {
      const delta = side === 'right'
        ? startX - ev.clientX
        : ev.clientX - startX
      const newWidth = Math.max(0, Math.min(maxWidth, startWidth + delta))

      if (newWidth < collapseThreshold) {
        if (!isCollapsed.value) {
          widthBeforeCollapse = startWidth
          isCollapsed.value = true
        }
      } else {
        isCollapsed.value = false
        width.value = Math.max(minWidth, newWidth)
      }
    }

    function onMouseUp() {
      isDragging.value = false
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      persist()
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  return { width, isCollapsed, isDragging, handleMouseDown, toggle }
}
