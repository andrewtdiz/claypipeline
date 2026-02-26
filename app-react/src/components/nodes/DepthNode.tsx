import { EyeIcon } from "@heroicons/react/20/solid";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "@/components/nodes/BaseNode";
import { usePipelineStore, type PipelineNodeData } from "@/store/pipelineStore";

export function DepthNode({ id, data }: NodeProps<PipelineNodeData>) {
  const nodeStates = usePipelineStore(state => state.nodeStates);
  const state = nodeStates.get(id);

  const modelLabel = data.params.model === "quality" ? "Quality" : "Fast";

  return (
    <BaseNode id={id} label={data.label || "Estimate Depth"} hasInput hasOutput icon={EyeIcon}>
      <div className="text-xs text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Model</span>
          <span className="text-gray-500">{modelLabel}</span>
        </div>
        <div className="flex justify-between">
          <span>Device</span>
          <span className="text-gray-500">{data.params.device as string}</span>
        </div>
        {state?.status === "error" ? (
          <div className="text-red-400 text-[10px] mt-1">{state.error}</div>
        ) : null}
      </div>
    </BaseNode>
  );
}

export default DepthNode;
