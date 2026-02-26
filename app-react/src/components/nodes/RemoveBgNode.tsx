import { ScissorsIcon } from "@heroicons/react/20/solid";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "@/components/nodes/BaseNode";
import { usePipelineStore, type PipelineNodeData } from "@/store/pipelineStore";

export function RemoveBgNode({ id, data }: NodeProps<PipelineNodeData>) {
  const nodeStates = usePipelineStore(state => state.nodeStates);
  const state = nodeStates.get(id);

  return (
    <BaseNode id={id} label={data.label || "Remove BG"} hasInput hasOutput icon={ScissorsIcon}>
      <div className="text-xs text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Model</span>
          <span className="text-gray-500">RMBG-1.4</span>
        </div>
        <div className="flex justify-between">
          <span>Threshold</span>
          <span className="text-gray-500">{Number(data.params.threshold).toFixed(2)}</span>
        </div>
        {state?.status === "error" ? (
          <div className="text-red-400 text-[10px] mt-1">{state.error}</div>
        ) : null}
      </div>
    </BaseNode>
  );
}

export default RemoveBgNode;
