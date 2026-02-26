import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Edge, Node } from "@xyflow/react";
import { getDownstreamNodes } from "pipemagic";
import type { EdgeDef, NodeType, PipelineDefinition } from "../../../shared/types/pipeline";
import type { ImageFrame } from "../../../shared/types/image-frame";
import type { NodeState } from "../../../shared/types/execution";
import { createDefaultNodeState } from "../../../shared/types/execution";
import { DEFAULT_PARAMS } from "../../../shared/types/node-params";

export type PipelineNodeData = {
  params: Record<string, unknown>;
  label?: string;
};

export type PipelineNode = Node<PipelineNodeData, NodeType>;
export type PipelineEdge = Edge;

const STORAGE_KEY = "pipemagic:pipeline";

type NodesUpdater = PipelineNode[] | ((nodes: PipelineNode[]) => PipelineNode[]);
type EdgesUpdater = PipelineEdge[] | ((edges: PipelineEdge[]) => PipelineEdge[]);

interface PipelineStore {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  selectedNodeId: string | null;
  isRunning: boolean;
  hasRun: boolean;
  nodeStates: Map<string, NodeState>;
  abortController: AbortController | null;
  inputImages: Map<string, ImageFrame>;
  fileHandle: FileSystemFileHandle | null;
  fileName: string | null;
  isDirty: boolean;
  pipelineLoadCount: number;

  setNodes: (updater: NodesUpdater) => void;
  setEdges: (updater: EdgesUpdater) => void;
  setIsDirty: (value: boolean) => void;
  setFileHandle: (handle: FileSystemFileHandle | null) => void;
  setFileName: (name: string | null) => void;
  setIsRunning: (value: boolean) => void;
  setAbortController: (controller: AbortController | null) => void;
  setHasRun: (value: boolean) => void;

  selectNode: (nodeId: string | null) => void;
  getNodeState: (nodeId: string) => NodeState;
  updateNodeState: (nodeId: string, update: Partial<NodeState>) => void;
  updateNodeParams: (nodeId: string, params: Record<string, unknown>) => void;
  invalidateNode: (nodeId: string) => void;
  invalidateDownstream: (nodeId: string) => void;
  setInputImage: (nodeId: string, frame: ImageFrame) => void;
  addNode: (type: NodeType, position: { x: number; y: number }) => string;
  removeNode: (nodeId: string) => void;
  clearExecution: () => void;
  loadDefaultPipeline: () => void;
  serializePipeline: () => PipelineDefinition;
  loadPipeline: (def: PipelineDefinition) => void;
  saveToStorage: () => void;
  restoreFromStorage: () => boolean;
}

const labels: Record<NodeType, string> = {
  input: "Image Input",
  output: "Output",
  "remove-bg": "Remove BG",
  normalize: "Normalize",
  upscale: "Upscale 2x",
  outline: "Outline",
  depth: "Estimate Depth",
  "face-parse": "Face Parse",
};

function buildEdgeDefs(edges: PipelineEdge[]): EdgeDef[] {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    sourceHandle: edge.sourceHandle || "output",
    target: edge.target,
    targetHandle: edge.targetHandle || "input",
  }));
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isRunning: false,
  hasRun: false,
  nodeStates: new Map(),
  abortController: null,
  inputImages: new Map(),
  fileHandle: null,
  fileName: null,
  isDirty: false,
  pipelineLoadCount: 0,

  setNodes: updater =>
    set(state => ({
      nodes: typeof updater === "function" ? updater(state.nodes) : updater,
    })),
  setEdges: updater =>
    set(state => ({
      edges: typeof updater === "function" ? updater(state.edges) : updater,
    })),
  setIsDirty: value => set({ isDirty: value }),
  setFileHandle: handle => set({ fileHandle: handle }),
  setFileName: name => set({ fileName: name }),
  setIsRunning: value => set({ isRunning: value }),
  setAbortController: controller => set({ abortController: controller }),
  setHasRun: value => set({ hasRun: value }),

  selectNode: nodeId => set({ selectedNodeId: nodeId }),

  getNodeState: nodeId => {
    const { nodeStates } = get();
    const existing = nodeStates.get(nodeId);
    if (existing) return existing;
    const nextStates = new Map(nodeStates);
    const nextState = createDefaultNodeState();
    nextStates.set(nodeId, nextState);
    set({ nodeStates: nextStates });
    return nextState;
  },

  updateNodeState: (nodeId, update) =>
    set(state => {
      const nextStates = new Map(state.nodeStates);
      const current = nextStates.get(nodeId) ?? createDefaultNodeState();
      nextStates.set(nodeId, { ...current, ...update });
      return { nodeStates: nextStates };
    }),

  invalidateNode: nodeId =>
    set(state => {
      const nextStates = new Map(state.nodeStates);
      const current = nextStates.get(nodeId) ?? createDefaultNodeState();
      nextStates.set(nodeId, {
        ...current,
        cacheKey: null,
        status: "idle",
        output: null,
      });
      return { nodeStates: nextStates };
    }),

  invalidateDownstream: nodeId =>
    set(state => {
      const edgeDefs = buildEdgeDefs(state.edges);
      const nextStates = new Map(state.nodeStates);
      for (const id of getDownstreamNodes(nodeId, edgeDefs)) {
        const current = nextStates.get(id) ?? createDefaultNodeState();
        nextStates.set(id, {
          ...current,
          cacheKey: null,
          status: "idle",
          output: null,
        });
      }
      return { nodeStates: nextStates };
    }),

  updateNodeParams: (nodeId, params) =>
    set(state => {
      const nextNodes = state.nodes.map(node => {
        if (node.id !== nodeId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            params: {
              ...node.data?.params,
              ...params,
            },
          },
        };
      });

      const edgeDefs = buildEdgeDefs(state.edges);
      const nextStates = new Map(state.nodeStates);
      const current = nextStates.get(nodeId) ?? createDefaultNodeState();
      nextStates.set(nodeId, {
        ...current,
        cacheKey: null,
        status: "idle",
        output: null,
      });

      for (const id of getDownstreamNodes(nodeId, edgeDefs)) {
        const downstream = nextStates.get(id) ?? createDefaultNodeState();
        nextStates.set(id, {
          ...downstream,
          cacheKey: null,
          status: "idle",
          output: null,
        });
      }

      return {
        nodes: nextNodes,
        isDirty: true,
        nodeStates: nextStates,
      };
    }),

  setInputImage: (nodeId, frame) =>
    set(state => {
      const nextImages = new Map(state.inputImages);
      nextImages.set(nodeId, frame);

      const edgeDefs = buildEdgeDefs(state.edges);
      const nextStates = new Map(state.nodeStates);
      for (const id of getDownstreamNodes(nodeId, edgeDefs)) {
        const downstream = nextStates.get(id) ?? createDefaultNodeState();
        nextStates.set(id, {
          ...downstream,
          cacheKey: null,
          status: "idle",
          output: null,
        });
      }

      const current = nextStates.get(nodeId) ?? createDefaultNodeState();
      nextStates.set(nodeId, {
        ...current,
        output: frame,
        status: "done",
        cacheKey: null,
      });

      return {
        inputImages: nextImages,
        isDirty: true,
        nodeStates: nextStates,
      };
    }),

  addNode: (type, position) => {
    const id = nanoid(8);
    const params = { ...(DEFAULT_PARAMS[type] as Record<string, unknown>) };
    const node: PipelineNode = {
      id,
      type,
      position,
      data: {
        params,
        label: labels[type],
      },
    };

    set(state => ({
      nodes: [...state.nodes, node],
      selectedNodeId: id,
      isDirty: true,
    }));

    return id;
  },

  removeNode: nodeId =>
    set(state => {
      const node = state.nodes.find(n => n.id === nodeId);
      if (!node) return {};
      if (node.type === "input" || node.type === "output") return {};

      const nextNodes = state.nodes.filter(n => n.id !== nodeId);
      const nextEdges = state.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
      const nextStates = new Map(state.nodeStates);
      nextStates.delete(nodeId);

      return {
        nodes: nextNodes,
        edges: nextEdges,
        nodeStates: nextStates,
        selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
        isDirty: true,
      };
    }),

  clearExecution: () =>
    set(state => {
      const nextStates = new Map<string, NodeState>();
      for (const [id] of state.nodeStates) {
        nextStates.set(id, createDefaultNodeState());
      }

      for (const [id, frame] of state.inputImages) {
        const current = nextStates.get(id) ?? createDefaultNodeState();
        nextStates.set(id, {
          ...current,
          output: frame,
          status: "done",
        });
      }

      return { nodeStates: nextStates };
    }),

  loadDefaultPipeline: () => {
    const inputId = nanoid(8);
    const removeBgId = nanoid(8);
    const normalizeId = nanoid(8);
    const outlineId = nanoid(8);
    const upscaleId = nanoid(8);
    const outputId = nanoid(8);

    set(state => ({
      nodes: [
        {
          id: inputId,
          type: "input",
          position: { x: 60, y: 180 },
          data: { params: { maxSize: 2048, fit: "contain" }, label: labels.input },
        },
        {
          id: removeBgId,
          type: "remove-bg",
          position: { x: 380, y: 180 },
          data: { params: { threshold: 0.5, device: "auto", dtype: "fp16" }, label: labels["remove-bg"] },
        },
        {
          id: normalizeId,
          type: "normalize",
          position: { x: 680, y: 180 },
          data: { params: { size: 2048, padding: 160 }, label: labels.normalize },
        },
        {
          id: outlineId,
          type: "outline",
          position: { x: 940, y: 200 },
          data: {
            params: { thickness: 50, color: "#ffffff", opacity: 1, quality: "high", position: "outside", threshold: 5 },
            label: labels.outline,
          },
        },
        {
          id: upscaleId,
          type: "upscale",
          position: { x: 1220, y: 200 },
          data: { params: { model: "cnn-2x-l", contentType: "rl" }, label: labels.upscale },
        },
        {
          id: outputId,
          type: "output",
          position: { x: 1500, y: 180 },
          data: { params: { format: "png", quality: 0.92 }, label: labels.output },
        },
      ],
      edges: [
        { id: nanoid(8), source: inputId, target: removeBgId, sourceHandle: "output", targetHandle: "input" },
        { id: nanoid(8), source: removeBgId, target: normalizeId, sourceHandle: "output", targetHandle: "input" },
        { id: nanoid(8), source: normalizeId, target: outlineId, sourceHandle: "output", targetHandle: "input" },
        { id: nanoid(8), source: outlineId, target: upscaleId, sourceHandle: "output", targetHandle: "input" },
        { id: nanoid(8), source: upscaleId, target: outputId, sourceHandle: "output", targetHandle: "input" },
      ],
      nodeStates: new Map(),
      inputImages: new Map(),
      fileHandle: null,
      fileName: null,
      isDirty: false,
      selectedNodeId: null,
      pipelineLoadCount: state.pipelineLoadCount + 1,
    }));
  },

  serializePipeline: () => {
    const { nodes, edges } = get();
    return {
      version: 1,
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type as NodeType,
        position: { x: node.position.x, y: node.position.y },
        params: node.data?.params || {},
        label: node.data?.label || undefined,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        sourceHandle: edge.sourceHandle || "output",
        target: edge.target,
        targetHandle: edge.targetHandle || "input",
      })),
    };
  },

  loadPipeline: def => {
    const previousImage = get().inputImages.values().next().value as ImageFrame | undefined;

    const nextNodes: PipelineNode[] = def.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: { x: node.position.x, y: node.position.y },
      data: {
        params: node.params,
        label: node.label || node.type,
      },
    }));

    const nextEdges: PipelineEdge[] = def.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle,
    }));

    const nextStates = new Map<string, NodeState>();
    const nextImages = new Map<string, ImageFrame>();

    if (previousImage) {
      for (const node of def.nodes) {
        if (node.type === "input") {
          nextImages.set(node.id, previousImage);
          nextStates.set(node.id, {
            ...createDefaultNodeState(),
            output: previousImage,
            status: "done",
          });
        }
      }
    }

    set(state => ({
      nodes: nextNodes,
      edges: nextEdges,
      nodeStates: nextStates,
      inputImages: nextImages,
      isDirty: false,
      selectedNodeId: null,
      pipelineLoadCount: state.pipelineLoadCount + 1,
    }));
  },

  saveToStorage: () => {
    const { nodes } = get();
    if (typeof window === "undefined") return;
    if (nodes.length === 0) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(get().serializePipeline()));
  },

  restoreFromStorage: () => {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const def = JSON.parse(raw) as PipelineDefinition;
      if (def.nodes?.length > 0) {
        get().loadPipeline(def);
        return true;
      }
    } catch {
      // ignore corrupt data
    }
    return false;
  },
}));
