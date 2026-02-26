import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

interface ResizablePanelOptions {
  key: string;
  side: "left" | "right";
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  collapseThreshold?: number;
  onDraggingChange?: (isDragging: boolean) => void;
}

interface PersistedState {
  width: number;
  collapsed: boolean;
}

const STORAGE_PREFIX = "panel:";

function loadState(key: string): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

function saveState(key: string, state: PersistedState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
}

export function useResizablePanel(options: ResizablePanelOptions) {
  const {
    key,
    side,
    defaultWidth,
    minWidth = 180,
    maxWidth = 280,
    collapseThreshold = 60,
    onDraggingChange,
  } = options;

  const saved = loadState(key);
  const [width, setWidth] = useState(saved?.width ?? defaultWidth);
  const [isCollapsed, setIsCollapsed] = useState(saved?.collapsed ?? false);
  const [isDragging, setIsDragging] = useState(false);

  const widthBeforeCollapse = useRef(width);
  const widthRef = useRef(width);
  const collapsedRef = useRef(isCollapsed);

  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  useEffect(() => {
    collapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  const persist = useCallback(
    (nextWidth = widthRef.current, nextCollapsed = collapsedRef.current) => {
      saveState(key, { width: nextWidth, collapsed: nextCollapsed });
    },
    [key],
  );

  const toggle = useCallback(() => {
    if (isCollapsed) {
      setIsCollapsed(false);
      const nextWidth = widthBeforeCollapse.current >= minWidth ? widthBeforeCollapse.current : defaultWidth;
      setWidth(nextWidth);
      persist(nextWidth, false);
    } else {
      widthBeforeCollapse.current = width;
      setIsCollapsed(true);
      persist(width, true);
    }
  }, [isCollapsed, minWidth, defaultWidth, width, persist]);

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(true);
      const startX = event.clientX;
      const startWidth = width;
      document.body.style.cursor = "col-resize";

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = side === "right" ? startX - moveEvent.clientX : moveEvent.clientX - startX;
        const newWidth = Math.max(0, Math.min(maxWidth, startWidth + delta));

        if (newWidth < collapseThreshold) {
          if (!isCollapsed) {
            widthBeforeCollapse.current = startWidth;
            setIsCollapsed(true);
            collapsedRef.current = true;
          }
        } else {
          setIsCollapsed(false);
          collapsedRef.current = false;
          const nextWidth = Math.max(minWidth, newWidth);
          setWidth(nextWidth);
          widthRef.current = nextWidth;
        }
      };

      const onMouseUp = () => {
        setIsDragging(false);
        document.body.style.cursor = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        persist();
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [width, side, maxWidth, collapseThreshold, isCollapsed, minWidth, persist],
  );

  useEffect(() => {
    onDraggingChange?.(isDragging);
  }, [isDragging, onDraggingChange]);

  return { width, isCollapsed, isDragging, handleMouseDown, toggle };
}
