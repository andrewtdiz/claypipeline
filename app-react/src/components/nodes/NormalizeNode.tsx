import { ArrowsPointingInIcon } from "@heroicons/react/20/solid";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "@/components/nodes/BaseNode";
import { usePipelineStore, type PipelineNodeData } from "@/store/pipelineStore";

export function NormalizeNode({ id, data }: NodeProps<PipelineNodeData>) {
  const nodeStates = usePipelineStore(state => state.nodeStates);
  const state = nodeStates.get(id);

  return (
    <BaseNode id={id} label={data.label || "Normalize"} hasInput hasOutput icon={ArrowsPointingInIcon}>
      <div className="text-xs text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Size</span>
          <span className="text-gray-500">{data.params.size as number}px</span>
        </div>
        <div className="flex justify-between">
          <span>Padding</span>
          <span className="text-gray-500">{data.params.padding as number}px</span>
        </div>
        {state?.status === "error" ? (
          <div className="text-red-400 text-[10px] mt-1">{state.error}</div>
        ) : null}
      </div>
    </BaseNode>
  );
}

export default NormalizeNode;
