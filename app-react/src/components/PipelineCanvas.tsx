import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Background,
  BaseEdge,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type EdgeProps,
  type NodeChange,
  getBezierPath,
  useReactFlow,
} from "@xyflow/react";
import { nanoid } from "nanoid";
import { Maximize2, Minus, Plus } from "lucide-react";
import type { NodeType } from "../../../shared/types/pipeline";
import { useElementSize } from "@/hooks/useElementSize";
import { usePipelineStore } from "@/store/pipelineStore";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import InputNode from "@/components/nodes/InputNode";
import OutputNode from "@/components/nodes/OutputNode";
import RemoveBgNode from "@/components/nodes/RemoveBgNode";
import UpscaleNode from "@/components/nodes/UpscaleNode";
import NormalizeNode from "@/components/nodes/NormalizeNode";
import OutlineNode from "@/components/nodes/OutlineNode";
import DepthNode from "@/components/nodes/DepthNode";
import FaceParseNode from "@/components/nodes/FaceParseNode";

const nodeTypes = {
  input: InputNode,
  output: OutputNode,
  "remove-bg": RemoveBgNode,
  normalize: NormalizeNode,
  upscale: UpscaleNode,
  outline: OutlineNode,
  depth: DepthNode,
  "face-parse": FaceParseNode,
};

const MINIMAP_BASE = 100;

const edgeTypes = {
  custom: CustomEdge,
};

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: selected ? "#888" : "#555",
        strokeWidth: selected ? 3 : 2,
      }}
    />
  );
}

function PipelineCanvasInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerW, height: containerH } = useElementSize(containerRef);
  const minimapW = useMemo(() => {
    if (!containerH) return MINIMAP_BASE;
    const aspect = containerW / containerH;
    return Math.round(aspect >= 1 ? MINIMAP_BASE * aspect : MINIMAP_BASE);
  }, [containerW, containerH]);
  const minimapH = useMemo(() => {
    if (!containerH) return MINIMAP_BASE;
    const aspect = containerW / containerH;
    return Math.round(aspect >= 1 ? MINIMAP_BASE : MINIMAP_BASE / aspect);
  }, [containerW, containerH]);

  const nodes = usePipelineStore(state => state.nodes);
  const edges = usePipelineStore(state => state.edges);
  const setNodes = usePipelineStore(state => state.setNodes);
  const setEdges = usePipelineStore(state => state.setEdges);
  const setIsDirty = usePipelineStore(state => state.setIsDirty);
  const selectNode = usePipelineStore(state => state.selectNode);
  const addNode = usePipelineStore(state => state.addNode);
  const pipelineLoadCount = usePipelineStore(state => state.pipelineLoadCount);

  const { screenToFlowPosition, setCenter, getViewport, fitView, zoomIn, zoomOut } = useReactFlow();

  const edgesForRender = useMemo(
    () => edges.map(edge => ({ ...edge, type: edge.type ?? "custom" })),
    [edges],
  );

  const nodeClassName = "!bg-transparent !border-0 !rounded-none !shadow-none !p-0";

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(current => applyNodeChanges(changes, current));
    },
    [setNodes],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(current => applyEdgeChanges(changes, current));
    },
    [setEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      setEdges(current => [
        ...current,
        {
          id: nanoid(8),
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle || "output",
          targetHandle: connection.targetHandle || "input",
        },
      ]);
      setIsDirty(true);
    },
    [setEdges, setIsDirty],
  );

  const [contextMenu, setContextMenu] = useState({ x: 0, y: 0 });

  const addableNodes: { type: NodeType; label: string }[] = [
    { type: "remove-bg", label: "Remove BG" },
    { type: "normalize", label: "Normalize" },
    { type: "outline", label: "Outline" },
    { type: "upscale", label: "Upscale 2x" },
    { type: "depth", label: "Estimate Depth" },
    { type: "face-parse", label: "Face Parse" },
  ];

  const onPaneContextMenu = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const onNodeContextMenu = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onEdgeContextMenu = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const addNodeFromMenu = useCallback(
    (type: NodeType) => {
      const canvasPos = screenToFlowPosition({ x: contextMenu.x, y: contextMenu.y });
      addNode(type, canvasPos);
    },
    [addNode, contextMenu.x, contextMenu.y, screenToFlowPosition],
  );

  const prevNodeCount = useRef(0);
  const lastLoadCount = useRef(pipelineLoadCount);

  useEffect(() => {
    const len = nodes.length;
    if (pipelineLoadCount !== lastLoadCount.current) {
      lastLoadCount.current = pipelineLoadCount;
      prevNodeCount.current = len;
      return;
    }
    if (len === prevNodeCount.current + 1 && prevNodeCount.current > 0) {
      const node = nodes[len - 1];
      if (node) {
        requestAnimationFrame(() => {
          const { zoom } = getViewport();
          setCenter(node.position.x + 90, node.position.y + 100, { duration: 300, zoom });
        });
      }
    }
    prevNodeCount.current = len;
  }, [nodes, pipelineLoadCount, getViewport, setCenter]);

  useEffect(() => {
    requestAnimationFrame(() => {
      fitView({ duration: 300, padding: 0.2 });
    });
  }, [pipelineLoadCount, fitView]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div ref={containerRef} className="w-full h-full" onContextMenu={onPaneContextMenu}>
          <ReactFlow
            nodes={nodes}
            edges={edgesForRender}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: "custom" }}
            defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
            className="bg-[#1a1a1a]"
            nodeClassName={nodeClassName}
            snapToGrid
            snapGrid={[20, 20]}
            minZoom={0.2}
            maxZoom={2}
            fitView
            connectionLineStyle={{ stroke: "#888", strokeWidth: 2, strokeDasharray: "5 5" }}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(_, node) => selectNode(node.id)}
            onNodeContextMenu={onNodeContextMenu}
            onPaneClick={() => selectNode(null)}
            onEdgeContextMenu={onEdgeContextMenu}
            onConnect={onConnect}
          >
            <Background gap={20} size={3} color="#222" />
            <MiniMap
              maskColor="rgba(0, 0, 0, 0.2)"
              nodeColor="#555"
              nodeStrokeColor="transparent"
              className="rounded-md border border-gray-700 overflow-hidden bg-[#1a1a1a]"
              style={{ width: minimapW, height: minimapH }}
            />

            <div className="absolute left-4 bottom-4 z-30 flex flex-col overflow-hidden rounded-md border border-gray-700 bg-gray-900">
              <Button variant="ghost" size="icon" onClick={() => zoomIn()} className="rounded-none">
                <Plus className="h-4 w-4 text-gray-400" />
              </Button>
              <Separator />
              <Button variant="ghost" size="icon" onClick={() => zoomOut()} className="rounded-none">
                <Minus className="h-4 w-4 text-gray-400" />
              </Button>
              <Separator />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fitView({ duration: 300, padding: 0.2 })}
                className="rounded-none"
              >
                <Maximize2 className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </ReactFlow>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="min-w-[160px] rounded-lg border border-gray-700 bg-gray-1200 py-1 shadow-xl">
        <ContextMenuLabel className="px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Add Node
        </ContextMenuLabel>
        <ContextMenuSeparator className="bg-gray-700" />
        {addableNodes.map(node => (
          <ContextMenuItem
            key={node.type}
            className="text-sm text-gray-300 focus:bg-gray-700 focus:text-white"
            onSelect={() => addNodeFromMenu(node.type)}
          >
            {node.label}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function PipelineCanvas() {
  return (
    <ReactFlowProvider>
      <PipelineCanvasInner />
    </ReactFlowProvider>
  );
}

export default PipelineCanvas;
