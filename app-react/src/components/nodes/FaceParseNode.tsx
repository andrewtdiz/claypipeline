import { UserIcon } from "@heroicons/react/20/solid";
import type { NodeProps } from "@xyflow/react";
import BaseNode from "@/components/nodes/BaseNode";
import { usePipelineStore, type PipelineNodeData } from "@/store/pipelineStore";

export function FaceParseNode({ id, data }: NodeProps<PipelineNodeData>) {
  const nodeStates = usePipelineStore(state => state.nodeStates);
  const state = nodeStates.get(id);

  return (
    <BaseNode id={id} label={data.label || "Face Parse"} hasInput hasOutput icon={UserIcon}>
      <div className="text-xs text-gray-400 space-y-1">
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

export default FaceParseNode;
