import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { createPortal } from "react-dom";
import type { NodeType } from "../../../shared/types/pipeline";
import { usePipelineStore } from "@/store/pipelineStore";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CHECKERBOARD_CLASS } from "@/lib/checkerboard";
import { useBitmapPreviewUrl } from "@/hooks/useBitmapPreviewUrl";

export function NodeInspector() {
  const nodes = usePipelineStore(state => state.nodes);
  const nodeStates = usePipelineStore(state => state.nodeStates);
  const selectedNodeId = usePipelineStore(state => state.selectedNodeId);
  const updateNodeParams = usePipelineStore(state => state.updateNodeParams);

  const node = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const state = useMemo(() => {
    if (!selectedNodeId) return null;
    return nodeStates.get(selectedNodeId) || null;
  }, [nodeStates, selectedNodeId]);

  const params = node?.data?.params as Record<string, unknown> | undefined;
  const outputFormat = String(params?.format ?? "png");
  const outlineColor = String(params?.color ?? "#ffffff");
  const nodeType = node?.type as NodeType | undefined;

  const [isZoomed, setIsZoomed] = useState(false);
  const previewUrl = useBitmapPreviewUrl(state?.output?.bitmap);

  const updateParam = (key: string, value: unknown) => {
    if (!node) return;
    updateNodeParams(node.id, { [key]: value });
  };

  const handleColorInput = (event: ChangeEvent<HTMLInputElement>) => {
    updateParam("color", event.target.value);
  };

  const statusLabel = useMemo(() => {
    if (!state) return "";
    switch (state.status) {
      case "idle":
        return "Idle";
      case "pending":
        return "Pending";
      case "running":
        return "Running...";
      case "done":
        return "Complete";
      case "cached":
        return "Cached";
      case "error":
        return "Error";
      default:
        return "";
    }
  }, [state]);

  const statusClass = useMemo(() => {
    if (!state) return "text-gray-500";
    switch (state.status) {
      case "running":
        return "text-yellow-400";
      case "done":
      case "cached":
        return "text-green-400";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-500";
    }
  }, [state]);

  if (!node) {
    return (
      <div className="flex flex-col overflow-y-auto h-full">
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-gray-600">Select a node to inspect</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      <div className="p-3 border-b border-gray-800">
        <div className="text-sm font-semibold text-gray-200">{node.data?.label || node.type}</div>
        <div className="text-[10px] text-gray-500 mt-0.5">
          {node.type} &middot; {node.id}
        </div>
      </div>

      <div className="p-3 border-b border-gray-800">
        <div className="cursor-zoom-in" onClick={() => previewUrl && setIsZoomed(true)}>
          {previewUrl ? (
            <img
              src={previewUrl}
              className={cn("w-full rounded border border-gray-700", CHECKERBOARD_CLASS)}
              alt="Node result"
            />
          ) : (
            <div
              className={cn(
                "flex w-full aspect-square items-center justify-center rounded border border-gray-700",
                CHECKERBOARD_CLASS,
              )}
            >
              <span className="text-[10px] text-gray-600">No output</span>
            </div>
          )}
          {state?.output ? (
            <div className="text-[10px] text-gray-500 mt-1">
              {state.output.width} &times; {state.output.height}
            </div>
          ) : null}
        </div>
      </div>

      <div className="px-3 py-2 border-b border-gray-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Status</span>
          <span className={statusClass}>{statusLabel}</span>
        </div>
        {state && state.status === "running" ? (
          <Progress
            value={(state.progress || 0) * 100}
            className="mt-1.5 h-1 bg-gray-800"
            indicatorClassName="bg-gray-500"
          />
        ) : null}
        {state?.error ? <div className="mt-1 text-[10px] text-red-400">{state.error}</div> : null}
        {state?.deviceUsed ? (
          <div className="mt-1 text-[10px] text-gray-500">Device: {state.deviceUsed}</div>
        ) : null}
      </div>

      <div className="p-3 space-y-3">
        <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Parameters</div>

        {nodeType === "input" && params ? (
          <>
            <label className="block text-xs">
              <span className="text-gray-400">Max Size</span>
              <Slider
                value={[Number(params.maxSize) || 2048]}
                min={256}
                max={4096}
                step={256}
                className="mt-1"
                onValueChange={value => updateParam("maxSize", value[0])}
              />
              <span className="text-gray-500 text-[10px]">{Number(params.maxSize) || 2048}px</span>
            </label>
            <label className="block text-xs">
              <span className="text-gray-400">Fit</span>
              <Select value={String(params.fit ?? "contain")} onValueChange={value => updateParam("fit", value)}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contain">Contain</SelectItem>
                  <SelectItem value="cover">Cover</SelectItem>
                  <SelectItem value="fill">Fill</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </>
        ) : null}

        {nodeType === "output" && params ? (
          <>
            <label className="block text-xs">
              <span className="text-gray-400">Format</span>
              <Select value={outputFormat} onValueChange={value => updateParam("format", value)}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
              </Select>
            </label>
            {outputFormat !== "png" ? (
              <label className="block text-xs">
                <span className="text-gray-400">Quality</span>
                <Slider
                  value={[Number(params.quality) || 0.92]}
                  min={0.1}
                  max={1}
                  step={0.01}
                  className="mt-1"
                  onValueChange={value => updateParam("quality", value[0])}
                />
                <span className="text-gray-500 text-[10px]">
                  {(((params.quality as number) || 0) * 100).toFixed(0)}%
                </span>
              </label>
            ) : null}
          </>
        ) : null}

        {nodeType === "remove-bg" && params ? (
          <>
            <label className="block text-xs">
              <span className="text-gray-400">Model Quality</span>
              <Select
                value={String(params.dtype || "q8")}
                onValueChange={value => updateParam("dtype", value)}
              >
                <SelectTrigger className="mt-1 h-8 text-xs bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="q8">Quantized 8-bit (~45 MB)</SelectItem>
                  <SelectItem value="fp16">Half precision (~88 MB)</SelectItem>
                  <SelectItem value="fp32">Full precision (~176 MB)</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="block text-xs">
              <span className="text-gray-400">Threshold</span>
              <Slider
                value={[Number(params.threshold) || 0]}
                min={0}
                max={1}
                step={0.01}
                className="mt-1"
                onValueChange={value => updateParam("threshold", value[0])}
              />
              <span className="text-gray-500 text-[10px]">{Number(params.threshold).toFixed(2)}</span>
            </label>
            <label className="block text-xs">
              <span className="text-gray-400">Device</span>
              <Select value={String(params.device ?? "auto")} onValueChange={value => updateParam("device", value)}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="webgpu">WebGPU</SelectItem>
                  <SelectItem value="wasm">WASM</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </>
        ) : null}

        {nodeType === "normalize" && params ? (
          <>
            <label className="block text-xs">
              <span className="text-gray-400">Size</span>
              <Slider
                value={[Number(params.size) || 2048]}
                min={128}
                max={4096}
                step={64}
                className="mt-1"
                onValueChange={value => updateParam("size", value[0])}
              />
              <span className="text-gray-500 text-[10px]">{Number(params.size) || 0}px</span>
            </label>
            <label className="block text-xs">
              <span className="text-gray-400">Padding</span>
              <Slider
                value={[Number(params.padding) || 0]}
                min={0}
                max={256}
                step={1}
                className="mt-1"
                onValueChange={value => updateParam("padding", value[0])}
              />
              <span className="text-gray-500 text-[10px]">{Number(params.padding) || 0}px</span>
            </label>
          </>
        ) : null}

        {nodeType === "upscale" && params ? (
          <>
            <label className="block text-xs">
              <span className="text-gray-400">Model</span>
              <Select value={String(params.model ?? "cnn-2x-s")} onValueChange={value => updateParam("model", value)}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cnn-2x-s">Small (~14 KB)</SelectItem>
                  <SelectItem value="cnn-2x-m">Medium (~35 KB)</SelectItem>
                  <SelectItem value="cnn-2x-l">Large (~114 KB)</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="block text-xs">
              <span className="text-gray-400">Content Type</span>
              <Select value={String(params.contentType ?? "rl")} onValueChange={value => updateParam("contentType", value)}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rl">Real Life</SelectItem>
                  <SelectItem value="an">Animation</SelectItem>
                  <SelectItem value="3d">3D / Gaming</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </>
        ) : null}

        {nodeType === "depth" && params ? (
          <>
            <label className="block text-xs">
              <span className="text-gray-400">Model</span>
              <Select value={String(params.model ?? "fast")} onValueChange={value => updateParam("model", value)}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Fast (~25 MB)</SelectItem>
                  <SelectItem value="quality">Quality (~40 MB)</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="block text-xs">
              <span className="text-gray-400">Device</span>
              <Select value={String(params.device ?? "auto")} onValueChange={value => updateParam("device", value)}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="webgpu">WebGPU</SelectItem>
                  <SelectItem value="wasm">WASM</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </>
        ) : null}

        {nodeType === "face-parse" && params ? (
          <label className="block text-xs">
            <span className="text-gray-400">Device</span>
            <Select value={String(params.device ?? "auto")} onValueChange={value => updateParam("device", value)}>
              <SelectTrigger className="mt-1 h-8 text-xs bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="webgpu">WebGPU</SelectItem>
                <SelectItem value="wasm">WASM</SelectItem>
              </SelectContent>
            </Select>
          </label>
        ) : null}

        {nodeType === "outline" && params ? (
          <>
            <label className="block text-xs">
              <span className="text-gray-400">Thickness</span>
              <Slider
                value={[Number(params.thickness) || 0]}
                min={1}
                max={128}
                step={1}
                className="mt-1"
                onValueChange={value => updateParam("thickness", value[0])}
              />
              <span className="text-gray-500 text-[10px]">{Number(params.thickness) || 0}px</span>
            </label>
            <label className="block text-xs">
              <span className="text-gray-400">Color</span>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="color"
                  value={outlineColor}
                  onChange={handleColorInput}
                  className="h-7 w-10 p-0 border-0 bg-transparent"
                />
                <span className="text-gray-500 text-[10px]">{outlineColor}</span>
              </div>
            </label>
            <label className="block text-xs">
              <span className="text-gray-400">Opacity</span>
              <Slider
                value={[Number(params.opacity) || 0]}
                min={0}
                max={1}
                step={0.01}
                className="mt-1"
                onValueChange={value => updateParam("opacity", value[0])}
              />
              <span className="text-gray-500 text-[10px]">
                {(((params.opacity as number) || 0) * 100).toFixed(0)}%
              </span>
            </label>
            <label className="block text-xs">
              <span className="text-gray-400">Position</span>
              <Select value={String(params.position ?? "outside")} onValueChange={value => updateParam("position", value)}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outside">Outside</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="inside">Inside</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="block text-xs">
              <span className="text-gray-400">Threshold</span>
              <Slider
                value={[Number(params.threshold) || 0]}
                min={-8}
                max={8}
                step={0.5}
                className="mt-1"
                onValueChange={value => updateParam("threshold", value[0])}
              />
              <span className="text-gray-500 text-[10px]">{Number(params.threshold) || 0}px</span>
            </label>
            <label className="block text-xs">
              <span className="text-gray-400">Quality</span>
              <Select value={String(params.quality ?? "high")} onValueChange={value => updateParam("quality", value)}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (fast)</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </>
        ) : null}
      </div>

      {isZoomed && previewUrl
        ? createPortal(
            <div
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center cursor-zoom-out"
              onClick={() => setIsZoomed(false)}
            >
              <img src={previewUrl} className="max-w-[90vw] max-h-[90vh] object-contain" alt="Node result zoom" />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default NodeInspector;
