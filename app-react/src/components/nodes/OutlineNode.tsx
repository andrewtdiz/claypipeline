import { PaintBrushIcon } from "@heroicons/react/20/solid";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "@/components/nodes/BaseNode";
import { usePipelineStore, type PipelineNodeData } from "@/store/pipelineStore";

export function OutlineNode({ id, data }: NodeProps<PipelineNodeData>) {
  const nodeStates = usePipelineStore(state => state.nodeStates);
  const state = nodeStates.get(id);

  return (
    <BaseNode id={id} label={data.label || "Outline"} hasInput hasOutput icon={PaintBrushIcon}>
      <div className="text-xs text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Thickness</span>
          <span className="text-gray-500">{data.params.thickness as number}px</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Color</span>
          <span
            className="w-4 h-4 rounded border border-gray-600"
            style={{ backgroundColor: data.params.color as string }}
          />
        </div>
        <div className="flex justify-between">
          <span>Position</span>
          <span className="text-gray-500">{data.params.position as string}</span>
        </div>
        {state?.status === "error" ? (
          <div className="text-red-400 text-[10px] mt-1">{state.error}</div>
        ) : null}
      </div>
    </BaseNode>
  );
}

export default OutlineNode;
