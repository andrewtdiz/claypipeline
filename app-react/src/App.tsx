import { useEffect, useRef, useState } from "react";
import AboutPanel from "@/components/AboutPanel";
import NodeInspector from "@/components/NodeInspector";
import PipelineCanvas from "@/components/PipelineCanvas";
import ProgressOverlay from "@/components/ProgressOverlay";
import ResizablePanel, { type ResizablePanelHandle } from "@/components/ResizablePanel";
import TopBar from "@/components/TopBar";
import { usePipelineStore } from "@/store/pipelineStore";
import { Button } from "@/components/ui/button";

export function App() {
  const [unsupported, setUnsupported] = useState<string | null>(null);
  const [leftDragging, setLeftDragging] = useState(false);
  const [rightDragging, setRightDragging] = useState(false);
  const leftPanelRef = useRef<ResizablePanelHandle>(null);

  const anyPanelDragging = leftDragging || rightDragging;

  useEffect(() => {
    if (window.innerWidth < 900) {
      setUnsupported("Only desktop supported for now.");
    } else if (!navigator.gpu) {
      setUnsupported("WebGPU is required but not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    const store = usePipelineStore.getState();
    if (!store.restoreFromStorage()) {
      store.loadDefaultPipeline();
    }
  }, []);

  const nodes = usePipelineStore(state => state.nodes);
  const edges = usePipelineStore(state => state.edges);
  const saveToStorage = usePipelineStore(state => state.saveToStorage);

  useEffect(() => {
    saveToStorage();
  }, [nodes, edges, saveToStorage]);

  if (unsupported) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 px-8 text-center text-muted-foreground">
        <p className="text-base">{unsupported}</p>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <a href="https://github.com/mo1app/pipemagic" target="_blank" rel="noreferrer">
            Read more at github →
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${anyPanelDragging ? "select-none" : ""}`}>
      <TopBar onToggleAbout={() => leftPanelRef.current?.toggle()} />
      <div className="flex-1 flex min-h-0">
        <ResizablePanel
          ref={leftPanelRef}
          panelKey="left"
          side="left"
          defaultWidth={280}
          minWidth={180}
          maxWidth={280}
          title="Panel"
          onDraggingChange={setLeftDragging}
        >
          <AboutPanel />
        </ResizablePanel>

        <div className={`flex-1 relative ${anyPanelDragging ? "pointer-events-none" : ""}`}>
          <PipelineCanvas />
          <ProgressOverlay />
        </div>

        <ResizablePanel
          panelKey="right"
          side="right"
          defaultWidth={280}
          minWidth={180}
          maxWidth={280}
          title="Inspector"
          onDraggingChange={setRightDragging}
        >
          <NodeInspector />
        </ResizablePanel>
      </div>
    </div>
  );
}

export default App;
