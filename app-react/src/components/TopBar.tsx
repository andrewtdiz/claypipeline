import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  DocumentDuplicateIcon,
  DocumentPlusIcon,
  EyeIcon,
  FolderOpenIcon,
  PaintBrushIcon,
  ScissorsIcon,
  SparklesIcon,
  UserIcon,
} from "@heroicons/react/20/solid";
import { nanoid } from "nanoid";
import type { NodeType, PipelineDefinition } from "../../../shared/types/pipeline";
import { DEFAULT_PARAMS } from "../../../shared/types/node-params";
import { usePipelineStore } from "@/store/pipelineStore";
import { useFileIo } from "@/hooks/useFileIo";
import { usePipelineRunner } from "@/hooks/usePipelineRunner";
import { CommandShortcut } from "@/components/CommandShortcut";
import logo from "@/logo.svg";
import { createPortal } from "react-dom";
import type { ComponentType } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TopBarProps {
  onToggleAbout: () => void;
}

interface MenuItem {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  shortcut?: string[];
  action?: () => void;
  separator?: boolean;
}

export function TopBar({ onToggleAbout }: TopBarProps) {
  const { savePipeline, savePipelineAs, openPipeline, newPipeline } = useFileIo();
  const { run: runPipeline, stop, runError } = usePipelineRunner();

  const nodes = usePipelineStore(state => state.nodes);
  const nodeStates = usePipelineStore(state => state.nodeStates);
  const inputImages = usePipelineStore(state => state.inputImages);
  const isRunning = usePipelineStore(state => state.isRunning);
  const selectedNodeId = usePipelineStore(state => state.selectedNodeId);
  const fileName = usePipelineStore(state => state.fileName);
  const addNode = usePipelineStore(state => state.addNode);
  const removeNode = usePipelineStore(state => state.removeNode);
  const setHasRun = usePipelineStore(state => state.setHasRun);
  const setFileHandle = usePipelineStore(state => state.setFileHandle);
  const setFileName = usePipelineStore(state => state.setFileName);
  const loadPipeline = usePipelineStore(state => state.loadPipeline);

  const highlightRun = useMemo(() => {
    if (isRunning || inputImages.size === 0) return false;
    return nodes.some(node => {
      const state = nodeStates.get(node.id);
      return !state || (state.status !== "done" && state.status !== "cached");
    });
  }, [isRunning, inputImages, nodes, nodeStates]);

  const run = useCallback(async () => {
    try {
      setHasRun(true);
      await runPipeline();
    } catch (error) {
      console.error("Pipeline run error:", error);
    }
  }, [runPipeline, setHasRun]);

  useEffect(() => {
    if (inputImages.size > 0) {
      if (isRunning) {
        stop();
        const timeout = setTimeout(() => run(), 50);
        return () => clearTimeout(timeout);
      }
      run();
    }
    return undefined;
  }, [inputImages, isRunning, run, stop]);

  const [gpuSupported, setGpuSupported] = useState(false);
  useEffect(() => {
    const checkGpu = async () => {
      try {
        setGpuSupported(!!navigator.gpu && !!(await navigator.gpu.requestAdapter()));
      } catch {
        setGpuSupported(false);
      }
    };
    checkGpu();
  }, []);

  const buildStickerPreset = (): PipelineDefinition => {
    const inputId = nanoid(8);
    const removeBgId = nanoid(8);
    const normalizeId = nanoid(8);
    const outlineId = nanoid(8);
    const upscaleId = nanoid(8);
    const outputId = nanoid(8);
    return {
      version: 1,
      nodes: [
        {
          id: inputId,
          type: "input",
          position: { x: 60, y: 180 },
          params: { maxSize: 2048, fit: "contain" },
          label: "Image Input",
        },
        {
          id: removeBgId,
          type: "remove-bg",
          position: { x: 380, y: 180 },
          params: { threshold: 0.5, device: "auto", dtype: "fp16" },
          label: "Remove BG",
        },
        {
          id: normalizeId,
          type: "normalize",
          position: { x: 680, y: 180 },
          params: { size: 2048, padding: 160 },
          label: "Normalize",
        },
        {
          id: outlineId,
          type: "outline",
          position: { x: 940, y: 200 },
          params: {
            thickness: 50,
            color: "#ffffff",
            opacity: 1,
            quality: "high",
            position: "outside",
            threshold: 5,
          },
          label: "Outline",
        },
        {
          id: upscaleId,
          type: "upscale",
          position: { x: 1220, y: 200 },
          params: { model: "cnn-2x-l", contentType: "rl" },
          label: "Upscale 2x",
        },
        {
          id: outputId,
          type: "output",
          position: { x: 1500, y: 180 },
          params: { ...DEFAULT_PARAMS.output },
          label: "Output",
        },
      ],
      edges: [
        { id: nanoid(8), source: inputId, sourceHandle: "output", target: removeBgId, targetHandle: "input" },
        { id: nanoid(8), source: removeBgId, sourceHandle: "output", target: normalizeId, targetHandle: "input" },
        { id: nanoid(8), source: normalizeId, sourceHandle: "output", target: outlineId, targetHandle: "input" },
        { id: nanoid(8), source: outlineId, sourceHandle: "output", target: upscaleId, targetHandle: "input" },
        { id: nanoid(8), source: upscaleId, sourceHandle: "output", target: outputId, targetHandle: "input" },
      ],
    };
  };

  const buildDepthMapPreset = (): PipelineDefinition => {
    const inputId = nanoid(8);
    const depthId = nanoid(8);
    const outputId = nanoid(8);
    return {
      version: 1,
      nodes: [
        {
          id: inputId,
          type: "input",
          position: { x: -20, y: 180 },
          params: { maxSize: 2048, fit: "contain" },
          label: "Image Input",
        },
        {
          id: depthId,
          type: "depth",
          position: { x: 340, y: 240 },
          params: { model: "fast", device: "auto" },
          label: "Estimate Depth",
        },
        {
          id: outputId,
          type: "output",
          position: { x: 680, y: 160 },
          params: { ...DEFAULT_PARAMS.output },
          label: "Output",
        },
      ],
      edges: [
        { id: nanoid(8), source: inputId, sourceHandle: "output", target: depthId, targetHandle: "input" },
        { id: nanoid(8), source: depthId, sourceHandle: "output", target: outputId, targetHandle: "input" },
      ],
    };
  };

  const loadPreset = useCallback(
    (build: () => PipelineDefinition) => {
      loadPipeline(build());
      setFileHandle(null);
      setFileName(null);
    },
    [loadPipeline, setFileHandle, setFileName],
  );

  const fileMenuItems = useMemo<MenuItem[]>(
    () => [
      { label: "New", icon: DocumentPlusIcon, shortcut: ["⌘", "N"], action: newPipeline },
      { label: "Open...", icon: FolderOpenIcon, shortcut: ["⌘", "O"], action: openPipeline },
      { separator: true, label: "" },
      { label: "Save", icon: ArrowDownTrayIcon, shortcut: ["⌘", "S"], action: savePipeline },
      { label: "Save As...", icon: DocumentDuplicateIcon, shortcut: ["⇧", "⌘", "S"], action: savePipelineAs },
    ],
    [newPipeline, openPipeline, savePipeline, savePipelineAs],
  );

  const presetMenuItems = useMemo<MenuItem[]>(
    () => [
      { label: "Sticker", icon: SparklesIcon, action: () => loadPreset(buildStickerPreset) },
      { label: "Depth Map", icon: EyeIcon, action: () => loadPreset(buildDepthMapPreset) },
    ],
    [loadPreset],
  );

  const addNodeAtCenter = useCallback(
    (type: NodeType) => {
      let maxX = 0;
      let maxY = 0;
      for (const node of nodes) {
        if (node.position.x > maxX) maxX = node.position.x;
        if (node.position.y > maxY) maxY = node.position.y;
      }
      addNode(type, { x: maxX + 300, y: maxY });
    },
    [nodes, addNode],
  );

  const addNodeItems = useMemo<MenuItem[]>(
    () => [
      { label: "Remove BG", icon: ScissorsIcon, action: () => addNodeAtCenter("remove-bg") },
      { label: "Normalize", icon: ArrowsPointingInIcon, action: () => addNodeAtCenter("normalize") },
      { label: "Outline", icon: PaintBrushIcon, action: () => addNodeAtCenter("outline") },
      { label: "Upscale 2x", icon: ArrowsPointingOutIcon, action: () => addNodeAtCenter("upscale") },
      { label: "Estimate Depth", icon: EyeIcon, action: () => addNodeAtCenter("depth") },
      { label: "Face Parse", icon: UserIcon, action: () => addNodeAtCenter("face-parse") },
    ],
    [addNodeAtCenter],
  );

  const handleKeyboard = useCallback(
    (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key === "s") {
        event.preventDefault();
        if (event.shiftKey) savePipelineAs();
        else savePipeline();
      }
      if (mod && event.key === "o") {
        event.preventDefault();
        openPipeline();
      }
      if (mod && event.key === "Enter") {
        event.preventDefault();
        if (isRunning) stop();
        else run();
      }
      if (event.key === "Delete" || event.key === "Backspace") {
        if (
          selectedNodeId &&
          !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as Element)?.tagName)
        ) {
          removeNode(selectedNodeId);
        }
      }
    },
    [openPipeline, savePipeline, savePipelineAs, isRunning, run, stop, selectedNodeId, removeNode],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [handleKeyboard]);

  return (
    <>
      <div className="h-11 bg-gray-900 border-b border-gray-800 flex items-center px-3 gap-2 flex-shrink-0">
        <img src={logo} alt="PipeMagic" className="w-6 h-6" />
        <span className="text-sm font-semibold text-gray-300 mr-4">PipeMagic</span>

        {[
          { label: "File", items: fileMenuItems },
          { label: "Add Node", items: addNodeItems },
          { label: "Presets", items: presetMenuItems },
        ].map(menu => (
          <DropdownMenu key={menu.label}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-white hover:bg-gray-800">
                {menu.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px] bg-gray-900 border-gray-700">
              {menu.items.map((item, index) =>
                item.separator ? (
                  <DropdownMenuSeparator key={`${menu.label}-sep-${index}`} className="bg-gray-700" />
                ) : (
                  <DropdownMenuItem
                    key={`${menu.label}-${item.label}-${index}`}
                    className="text-xs text-gray-300 focus:bg-gray-800/80 focus:text-white"
                    onSelect={() => item.action?.()}
                  >
                    {item.icon ? <item.icon className="mr-2 h-3.5 w-3.5 text-gray-400" /> : null}
                    <span className="flex-1 text-xs">{item.label}</span>
                    {item.shortcut ? <CommandShortcut keys={item.shortcut} /> : null}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ))}

        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={onToggleAbout}
        >
          About
        </Button>

        <div className="flex-1" />

        {fileName ? (
          <span className="text-[10px] text-gray-500 max-w-[200px] truncate">
            {fileName}
          </span>
        ) : null}

        {runError ? (
          <span className="text-[10px] text-red-400 max-w-[300px] truncate px-2" title={runError}>
            {runError}
          </span>
        ) : null}

        {!isRunning ? (
          <Button
            variant="default"
            size="sm"
            className={
              highlightRun
                ? "bg-[#535DFF] hover:bg-[#4750e0] shadow-[0_0_14px_rgba(83,93,255,0.5)] animate-run-glow"
                : "bg-gray-600 hover:bg-gray-500"
            }
            onClick={run}
          >
            Run Pipeline
            <CommandShortcut keys={["⌘", "↵"]} />
          </Button>
        ) : (
          <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-500" onClick={stop}>
            Stop
          </Button>
        )}
      </div>

      {createPortal(
        <Badge
          variant="muted"
          className={`fixed bottom-2 right-2 z-50 text-[10px] ${
            gpuSupported ? "text-green-400 bg-green-900/30 border-transparent" : "text-yellow-400 bg-yellow-900/30 border-transparent"
          }`}
        >
          {gpuSupported ? "WebGPU" : "WASM"}
        </Badge>,
        document.body,
      )}
    </>
  );
}

export default TopBar;
