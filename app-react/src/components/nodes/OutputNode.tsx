import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { NodeProps } from "@xyflow/react";
import { bitmapToBlob } from "pipemagic";
import BaseNode from "@/components/nodes/BaseNode";
import { usePipelineStore, type PipelineNodeData } from "@/store/pipelineStore";
import { Button } from "@/components/ui/button";

export function OutputNode({ id, data }: NodeProps<PipelineNodeData>) {
  const nodeStates = usePipelineStore(state => state.nodeStates);
  const state = nodeStates.get(id);

  const downloadOutput = async () => {
    const output = state?.output;
    if (!output) return;
    const format = (data.params.format as string) || "png";
    const quality = (data.params.quality as number) || 0.92;
    const blob = await bitmapToBlob(output.bitmap, format as "png" | "jpeg" | "webp", quality);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `output.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <BaseNode id={id} label={data.label || "Output"} hasInput icon={ArrowDownTrayIcon}>
      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-xs">
          {state?.output ? `${state.output.width} × ${state.output.height}` : "No output yet"}
        </span>
        {state?.output ? (
          <Button
            variant="secondary"
            size="sm"
            className="text-[10px] h-6 px-2 py-0 bg-gray-600 hover:bg-gray-500"
            onClick={event => {
              event.stopPropagation();
              downloadOutput();
            }}
          >
            Download
          </Button>
        ) : null}
      </div>
    </BaseNode>
  );
}

export default OutputNode;
