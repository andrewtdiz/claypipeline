import { useState } from "react";
import type { DragEvent } from "react";
import { PhotoIcon } from "@heroicons/react/20/solid";
import type { NodeProps } from "@xyflow/react";
import { fileToBitmap, resizeBitmap } from "pipemagic";
import type { ImageFrame } from "../../../../shared/types/image-frame";
import BaseNode from "@/components/nodes/BaseNode";
import { usePipelineStore, type PipelineNodeData } from "@/store/pipelineStore";

export function InputNode({ id, data }: NodeProps<PipelineNodeData>) {
  const setInputImage = usePipelineStore(state => state.setInputImage);
  const inputImages = usePipelineStore(state => state.inputImages);
  const [isDragging, setIsDragging] = useState(false);

  const frame = inputImages.get(id) || null;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const bitmap = await fileToBitmap(file);
    const maxSize = (data.params.maxSize as number) || 2048;
    const fit = (data.params.fit as "contain" | "cover" | "fill") || "contain";
    const resized = await resizeBitmap(bitmap, maxSize, fit);
    const imageFrame: ImageFrame = {
      bitmap: resized,
      width: resized.width,
      height: resized.height,
      revision: Date.now(),
    };
    setInputImage(id, imageFrame);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const openFilePicker = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  };

  return (
    <BaseNode id={id} label={data.label || "Input"} hasOutput icon={PhotoIcon}>
      <div
        className={`border-2 border-dashed rounded-md p-3 text-center cursor-pointer transition-all min-h-[80px] flex flex-col items-center justify-center gap-1 ${
          isDragging || !frame
            ? "border-[#535DFF] bg-[#535DFF]/10 shadow-[0_0_12px_rgba(83,93,255,0.4)]"
            : "border-gray-600 hover:border-gray-500"
        }`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={openFilePicker}
      >
        {!frame ? (
          <span className="relative text-xs text-gray-500">
            Drop image or click
            <span
              aria-hidden="true"
              className="absolute inset-0 text-transparent bg-clip-text bg-[length:300%_100%] bg-[position:150%_50%] bg-[linear-gradient(120deg,_rgba(148,154,233,0)_0%,_rgba(83,93,255,1)_30%,_rgba(255,255,255,1)_50%,_rgba(83,93,255,1)_70%,_rgba(148,154,233,0)_100%)] animate-shine"
            >
              Drop image or click
            </span>
          </span>
        ) : (
          <span className="text-xs text-gray-500">Drop image or click</span>
        )}
      </div>
    </BaseNode>
  );
}

export default InputNode;
