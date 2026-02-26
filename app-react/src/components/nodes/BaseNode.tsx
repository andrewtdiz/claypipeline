import { useMemo } from "react";
import type { ComponentType, ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { usePipelineStore } from "@/store/pipelineStore";
import { createDefaultNodeState } from "../../../../shared/types/execution";
import { cn } from "@/lib/utils";
import { CHECKERBOARD_CLASS } from "@/lib/checkerboard";
import { useBitmapPreviewUrl } from "@/hooks/useBitmapPreviewUrl";

interface BaseNodeProps {
  id: string;
  label: string;
  hasInput?: boolean;
  hasOutput?: boolean;
  hidePreview?: boolean;
  color?: string;
  icon?: ComponentType<{ className?: string }>;
  children?: ReactNode;
}

export function BaseNode({
  id,
  label,
  hasInput,
  hasOutput,
  hidePreview,
  icon: Icon,
  children,
}: BaseNodeProps) {
  const nodeState = usePipelineStore(state => state.nodeStates.get(id));
  const selectedNodeId = usePipelineStore(state => state.selectedNodeId);
  const state = nodeState ?? createDefaultNodeState();

  const statusDotClass = useMemo(() => {
    switch (state.status) {
      case "running":
        return "bg-yellow-400";
      case "done":
      case "cached":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "pending":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  }, [state.status]);

  const isSelected = selectedNodeId === id;

  const borderColor = useMemo(() => {
    if (isSelected) return "border-[#535DFF]";
    if (state.status === "error") return "border-red-500";
    return "border-gray-700";
  }, [isSelected, state.status]);

  const previewUrl = useBitmapPreviewUrl(state.output?.bitmap);

  return (
    <div className={cn("relative min-w-[180px] select-none rounded-lg border bg-gray-900 shadow-lg", borderColor)}>
      <div
        className="flex items-center gap-2 rounded-t-lg border-b border-gray-800 px-3 py-2 text-xs font-semibold tracking-wide text-white"
      >
        <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", statusDotClass)} />
        <span className="truncate flex-1 text-left">{label}</span>
        {state.deviceUsed ? (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{state.deviceUsed}</span>
        ) : null}
        {Icon ? <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" /> : null}
      </div>

      {!hidePreview ? (
        <div className="px-3 pt-3">
          {previewUrl ? (
            <img
              src={previewUrl}
              className={cn("max-w-[150px] rounded border border-gray-700", CHECKERBOARD_CLASS)}
              alt="Step result"
            />
          ) : (
            <div
              className={cn(
                "flex h-[150px] w-[150px] items-center justify-center rounded border border-gray-700",
                CHECKERBOARD_CLASS,
              )}
            >
              <span className="text-[10px] text-gray-600">No output</span>
            </div>
          )}
        </div>
      ) : null}

      <div className="p-3">{children}</div>

      {state.status === "running" && state.progress > 0 ? (
        <div className="h-1 bg-gray-800 rounded-b-lg overflow-hidden">
          <div className="h-full bg-gray-500 transition-all duration-300" style={{ width: `${state.progress * 100}%` }} />
        </div>
      ) : null}

      {hasInput ? (
        <Handle
          id="input"
          type="target"
          position={Position.Left}
          className="h-3 w-3 rounded-full border-2 border-gray-700 bg-gray-500 hover:bg-gray-300 hover:border-gray-300"
        />
      ) : null}
      {hasOutput ? (
        <Handle
          id="output"
          type="source"
          position={Position.Right}
          className="h-3 w-3 rounded-full border-2 border-gray-700 bg-gray-500 hover:bg-gray-300 hover:border-gray-300"
        />
      ) : null}
    </div>
  );
}

export default BaseNode;
