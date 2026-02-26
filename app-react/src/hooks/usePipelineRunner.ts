import { useCallback, useState } from "react";
import {
  initGpu,
  getGpuDevice,
  createFrame,
  topoSort,
  getUpstreamNodes,
  validatePipeline,
  computeCacheKey,
  resizeBitmap,
  executeRemoveBg,
  executeUpscale,
  executeNormalize,
  executeOutline,
  executeDepth,
  executeFaceParse,
} from "pipemagic";
import type { NodeDef, EdgeDef, ImageFrame, ExecutionContext, NodeExecutor, NodeType } from "pipemagic";
import { usePipelineStore } from "@/store/pipelineStore";

const executors: Record<string, NodeExecutor> = {
  "remove-bg": executeRemoveBg,
  normalize: executeNormalize,
  upscale: executeUpscale,
  outline: executeOutline,
  depth: executeDepth,
  "face-parse": executeFaceParse,
};

export function usePipelineRunner() {
  const [runError, setRunError] = useState<string | null>(null);

  const run = useCallback(async () => {
    const store = usePipelineStore.getState();

    const nodeDefs = store.nodes.map(node => ({
      id: node.id,
      type: node.type as NodeType,
      position: node.position,
      params: node.data?.params || {},
    })) as NodeDef[];

    const edgeDefs = store.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle || "output",
      target: edge.target,
      targetHandle: edge.targetHandle || "input",
    })) as EdgeDef[];

    const errors = validatePipeline(nodeDefs, edgeDefs);
    if (errors.length > 0) {
      const msg = errors.map(err => err.message).join("\n");
      console.warn("Pipeline validation errors:", msg);
      setRunError(msg);
      return;
    }

    const inputNodes = store.nodes.filter(node => node.type === "input");
    for (const inputNode of inputNodes) {
      if (!store.inputImages.has(inputNode.id)) {
        setRunError("Please add an image to the Input node before running.");
        return;
      }
    }

    setRunError(null);

    await initGpu();

    const abortController = new AbortController();
    store.setAbortController(abortController);
    store.setIsRunning(true);

    for (const node of store.nodes) {
      const state = store.getNodeState(node.id);
      if (state.status !== "done" && state.status !== "cached") {
        store.updateNodeState(node.id, { status: "pending", progress: 0, error: null });
      }
    }

    const ctx: ExecutionContext = {
      abortSignal: abortController.signal,
      gpuDevice: getGpuDevice(),
      onProgress: (nodeId, progress) => {
        store.updateNodeState(nodeId, { progress });
      },
      onStatus: (nodeId, status, error) => {
        store.updateNodeState(nodeId, { status, error: error || null });
      },
      onStatusMessage: (nodeId, message) => {
        store.updateNodeState(nodeId, { statusMessage: message });
      },
      onDownloadProgress: (nodeId, progress) => {
        store.updateNodeState(nodeId, { downloadProgress: progress });
      },
    };

    try {
      const order = topoSort(nodeDefs, edgeDefs);
      console.log("[pipeline] execution order:", order);

      for (const nodeId of order) {
        if (abortController.signal.aborted) break;

        const node = store.nodes.find(n => n.id === nodeId);
        if (!node) continue;

        const nodeType = node.type as NodeType;
        const params = node.data?.params || {};
        console.log(`[pipeline] executing node ${nodeId} (${nodeType})`);

        const upstreamIds = getUpstreamNodes(nodeId, edgeDefs);
        const inputs: ImageFrame[] = [];
        const inputRevisions: number[] = [];

        for (const upId of upstreamIds) {
          const upState = store.getNodeState(upId);
          if (upState.output) {
            inputs.push(upState.output);
            inputRevisions.push(upState.output.revision);
          }
        }

        const cacheKey = computeCacheKey(nodeId, params, inputRevisions);
        const existingState = store.getNodeState(nodeId);
        if (existingState.cacheKey === cacheKey && existingState.output) {
          store.updateNodeState(nodeId, { status: "cached" });
          continue;
        }

        store.updateNodeState(nodeId, { status: "running", progress: 0 });

        try {
          let output: ImageFrame;

          if (nodeType === "input") {
            const frame = store.inputImages.get(nodeId);
            if (!frame) throw new Error("No input image");
            const maxSize = (params.maxSize as number) || 2048;
            const fit = (params.fit as "contain" | "cover" | "fill") || "contain";
            const resized = await resizeBitmap(frame.bitmap, maxSize, fit);
            output = createFrame(resized);
          } else if (nodeType === "output") {
            if (inputs.length === 0) throw new Error("No input to output node");
            output = inputs[0];
          } else {
            const executor = executors[nodeType];
            if (!executor) throw new Error(`No executor for node type: ${nodeType}`);
            if (inputs.length === 0) throw new Error("No input image");
            const nodeCtx: ExecutionContext = {
              ...ctx,
              onProgress: (_id, progress) => ctx.onProgress(nodeId, progress),
              onStatus: (_id, status, error) => ctx.onStatus(nodeId, status, error),
              onStatusMessage: (_id, message) => ctx.onStatusMessage?.(nodeId, message),
              onDownloadProgress: (_id, progress) => ctx.onDownloadProgress?.(nodeId, progress),
            };
            output = await executor(nodeCtx, inputs, params);
          }

          console.log(`[pipeline] node ${nodeId} (${nodeType}) done`);
          store.updateNodeState(nodeId, {
            status: "done",
            progress: 1,
            statusMessage: null,
            downloadProgress: null,
            output,
            cacheKey,
            error: null,
          });
        } catch (error: any) {
          if (error?.name === "AbortError" || abortController.signal.aborted) break;
          console.error(`[pipeline] node ${nodeId} (${nodeType}) error:`, error);
          store.updateNodeState(nodeId, {
            status: "error",
            error: error?.message || "Unknown error",
          });
        }
      }
    } finally {
      store.setIsRunning(false);
      store.setAbortController(null);
    }
  }, []);

  const stop = useCallback(() => {
    const store = usePipelineStore.getState();
    store.abortController?.abort();
  }, []);

  return { run, stop, runError };
}
