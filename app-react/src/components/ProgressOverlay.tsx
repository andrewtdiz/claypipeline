import { useMemo } from "react";
import { usePipelineStore } from "@/store/pipelineStore";
import { Progress } from "@/components/ui/progress";

export function ProgressOverlay() {
  const nodes = usePipelineStore(state => state.nodes);
  const nodeStates = usePipelineStore(state => state.nodeStates);
  const isRunning = usePipelineStore(state => state.isRunning);

  const runningNodes = useMemo(() => {
    const running: { id: string; label: string; progress: number; downloadProgress: number | null }[] = [];
    for (const node of nodes) {
      const state = nodeStates.get(node.id);
      if (state && (state.status === "running" || state.status === "pending")) {
        running.push({
          id: node.id,
          label: node.data?.label || node.type || node.id,
          progress: state.progress ?? 0,
          downloadProgress: state.downloadProgress,
        });
      }
    }
    return running;
  }, [nodes, nodeStates]);

  if (!isRunning || runningNodes.length === 0) return null;

  return (
    <div className="absolute bottom-4 left-4 bg-gray-900/90 border border-gray-700 rounded-lg p-3 min-w-[200px] z-40 backdrop-blur animate-in fade-in duration-200">
      <div className="text-xs font-semibold text-gray-300 mb-2">Running Pipeline</div>
      {runningNodes.map(node => (
        <div key={node.id} className="mb-1.5 last:mb-0">
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
            <span>{node.label}</span>
            <span>{(node.progress * 100).toFixed(0)}%</span>
          </div>
          <Progress value={node.progress * 100} className="h-1 bg-gray-800" indicatorClassName="bg-gray-500" />
          {node.downloadProgress != null ? (
            <div className="mt-1.5">
              <div className="text-[10px] text-gray-500 mb-0.5">Downloading model</div>
              <Progress value={node.downloadProgress * 100} className="h-1 bg-gray-800" indicatorClassName="bg-gray-500" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default ProgressOverlay;
