import { nanoid } from "nanoid";
import { useCallback } from "react";
import type { PipelineDefinition } from "../../../shared/types/pipeline";
import { usePipelineStore } from "@/store/pipelineStore";

const filePickerOptions = {
  types: [
    {
      description: "PipeMagic",
      accept: { "application/json": [".imgpipe.json"] },
    },
  ],
};

export function useFileIo() {
  const savePipeline = useCallback(async () => {
    const store = usePipelineStore.getState();
    if (store.fileHandle) {
      await writeToHandle(store.fileHandle);
    } else {
      await savePipelineAs();
    }
  }, []);

  const savePipelineAs = useCallback(async () => {
    const store = usePipelineStore.getState();
    const json = JSON.stringify(store.serializePipeline(), null, 2);

    if ("showSaveFilePicker" in window) {
      try {
        const handle = await (window as typeof window & { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> })
          .showSaveFilePicker({
            ...filePickerOptions,
            suggestedName: "pipeline.imgpipe.json",
          });
        store.setFileHandle(handle);
        store.setFileName(handle.name);
        await writeToHandle(handle);
        store.setIsDirty(false);
        return;
      } catch (error: any) {
        if (error?.name === "AbortError") return;
      }
    }

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pipeline.imgpipe.json";
    anchor.click();
    URL.revokeObjectURL(url);
    store.setIsDirty(false);
  }, []);

  const writeToHandle = useCallback(async (handle: FileSystemFileHandle) => {
    const store = usePipelineStore.getState();
    const json = JSON.stringify(store.serializePipeline(), null, 2);
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
    store.setIsDirty(false);
  }, []);

  const openPipeline = useCallback(async () => {
    const store = usePipelineStore.getState();
    if (store.isDirty) {
      const ok = confirm("You have unsaved changes. Discard them?");
      if (!ok) return;
    }

    let json: string;

    if ("showOpenFilePicker" in window) {
      try {
        const [handle] = await (window as typeof window & { showOpenFilePicker: (opts: unknown) => Promise<FileSystemFileHandle[]> })
          .showOpenFilePicker({
            ...filePickerOptions,
            multiple: false,
          });
        const file = await handle.getFile();
        json = await file.text();
        store.setFileHandle(handle);
        store.setFileName(handle.name);
      } catch (error: any) {
        if (error?.name === "AbortError") return;
        throw error;
      }
    } else {
      json = await new Promise<string>((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json,.imgpipe.json";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return reject(new Error("No file selected"));
          const text = await file.text();
          store.setFileName(file.name);
          resolve(text);
        };
        input.click();
      });
    }

    try {
      const def = JSON.parse(json) as PipelineDefinition;
      if (def.version !== 1 || !Array.isArray(def.nodes) || !Array.isArray(def.edges)) {
        throw new Error("Invalid pipeline file format");
      }
      store.loadPipeline(def);
    } catch (error: any) {
      alert(`Failed to load pipeline: ${error?.message || "Unknown error"}`);
    }
  }, []);

  const newPipeline = useCallback(() => {
    const store = usePipelineStore.getState();
    if (store.isDirty) {
      const ok = confirm("You have unsaved changes. Discard them?");
      if (!ok) return;
    }
    const inputId = nanoid(8);
    const outputId = nanoid(8);
    store.loadPipeline({
      version: 1,
      nodes: [
        { id: inputId, type: "input", position: { x: 100, y: 200 }, params: { maxSize: 2048, fit: "contain" }, label: "Image Input" },
        { id: outputId, type: "output", position: { x: 500, y: 200 }, params: { format: "png", quality: 0.92 }, label: "Output" },
      ],
      edges: [
        { id: nanoid(8), source: inputId, sourceHandle: "output", target: outputId, targetHandle: "input" },
      ],
    });
    store.setFileHandle(null);
    store.setFileName(null);
  }, []);

  return { savePipeline, savePipelineAs, openPipeline, newPipeline };
}
