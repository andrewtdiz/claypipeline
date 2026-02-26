type WorkerResponse =
  | { type: "status"; message: string }
  | { type: "progress"; progress: number }
  | { type: "result"; imageData: ArrayBuffer; width: number; height: number }
  | { type: "error"; message: string }
  | { type: "device"; device: string };

export interface ModelWorker {
  load: (model: string, task: string, device: string) => Promise<string>;
  run: (imageData: ImageData, params: Record<string, unknown>, onProgress?: (p: number) => void) => Promise<ImageData>;
  terminate: () => void;
}

export function createModelWorker(worker: Worker): ModelWorker {
  let resolveLoad: ((device: string) => void) | null = null;
  let rejectLoad: ((e: Error) => void) | null = null;
  let resolveRun: ((data: ImageData) => void) | null = null;
  let rejectRun: ((e: Error) => void) | null = null;
  let onProgress: ((p: number) => void) | null = null;

  worker.onerror = event => {
    const err = new Error(`Worker error: ${(event as ErrorEvent).message || "unknown"}`);
    console.error("Worker onerror:", event);
    if (rejectLoad) {
      rejectLoad(err);
      rejectLoad = null;
      resolveLoad = null;
    }
    if (rejectRun) {
      rejectRun(err);
      rejectRun = null;
      resolveRun = null;
      onProgress = null;
    }
  };

  worker.onmessageerror = event => {
    console.error("Worker message error:", event);
  };

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const msg = event.data;
    switch (msg.type) {
      case "status":
        console.log("[worker]", msg.message);
        break;
      case "device":
        console.log("[worker] device:", msg.device);
        resolveLoad?.(msg.device);
        resolveLoad = null;
        rejectLoad = null;
        break;
      case "progress":
        onProgress?.(msg.progress);
        break;
      case "result": {
        const arr = new Uint8ClampedArray(msg.imageData);
        const imgData = new ImageData(arr, msg.width, msg.height);
        resolveRun?.(imgData);
        resolveRun = null;
        rejectRun = null;
        onProgress = null;
        break;
      }
      case "error":
        console.error("[worker] error:", msg.message);
        if (rejectLoad) {
          rejectLoad(new Error(msg.message));
          rejectLoad = null;
          resolveLoad = null;
        }
        if (rejectRun) {
          rejectRun(new Error(msg.message));
          rejectRun = null;
          resolveRun = null;
          onProgress = null;
        }
        break;
    }
  };

  return {
    load(model, task, device) {
      return new Promise((resolve, reject) => {
        resolveLoad = resolve;
        rejectLoad = reject;
        worker.postMessage({ type: "load", model, task, device });
      });
    },
    run(imageData, params, progressCb) {
      return new Promise((resolve, reject) => {
        resolveRun = resolve;
        rejectRun = reject;
        onProgress = progressCb || null;
        const buffer = imageData.data.buffer.slice(0);
        worker.postMessage(
          { type: "run", imageData: buffer, width: imageData.width, height: imageData.height, params },
          [buffer],
        );
      });
    },
    terminate() {
      worker.terminate();
    },
  };
}

const workerCache = new Map<string, ModelWorker>();

export function getOrCreateWorker(key: string, createWorkerFn: () => Worker): ModelWorker {
  let worker = workerCache.get(key);
  if (!worker) {
    const raw = createWorkerFn();
    worker = createModelWorker(raw);
    workerCache.set(key, worker);
  }
  return worker;
}
