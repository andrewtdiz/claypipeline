import { forwardRef, useImperativeHandle } from "react";
import type { ReactNode } from "react";
import { useResizablePanel } from "@/hooks/useResizablePanel";

export interface ResizablePanelHandle {
  toggle: () => void;
  isCollapsed: boolean;
}

interface ResizablePanelProps {
  panelKey: string;
  side: "left" | "right";
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  collapseThreshold?: number;
  title?: string;
  onDraggingChange?: (isDragging: boolean) => void;
  children?: ReactNode;
}

export const ResizablePanel = forwardRef<ResizablePanelHandle, ResizablePanelProps>(
  (
    {
      panelKey,
      side,
      defaultWidth = 240,
      minWidth = 180,
      maxWidth = 280,
      collapseThreshold = 60,
      onDraggingChange,
      children,
    },
    ref,
  ) => {
    const { width, isCollapsed, isDragging, handleMouseDown, toggle } = useResizablePanel({
      key: panelKey,
      side,
      defaultWidth,
      minWidth,
      maxWidth,
      collapseThreshold,
      onDraggingChange,
    });

    useImperativeHandle(ref, () => ({ toggle, isCollapsed }), [toggle, isCollapsed]);

    if (isCollapsed) {
      return (
        <div
          className={`w-5 bg-gray-900 flex-shrink-0 flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors ${
            side === "right" ? "border-l border-gray-800" : "border-r border-gray-800"
          }`}
          onClick={toggle}
        >
          <span className="text-gray-500 text-xs select-none">{side === "right" ? "◀" : "▶"}</span>
        </div>
      );
    }

    return (
      <div
        className={`relative flex-shrink-0 bg-gray-900 flex ${
          side === "right" ? "border-l border-gray-800 flex-row-reverse" : "border-r border-gray-800 flex-row"
        }`}
        style={{ width: `${width}px` }}
      >
        <div
          className={`absolute top-0 bottom-0 w-1 z-10 cursor-col-resize hover:bg-blue-500/40 transition-colors ${
            side === "right" ? "-left-0.5" : "-right-0.5"
          } ${isDragging ? "bg-blue-500/40" : ""}`}
          onMouseDown={handleMouseDown}
        />

        <div className="flex-1 min-w-0 overflow-hidden">{children}</div>
      </div>
    );
  },
);

ResizablePanel.displayName = "ResizablePanel";

export default ResizablePanel;
