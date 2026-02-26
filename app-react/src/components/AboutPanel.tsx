import GitHubIcon from "@/components/icons/GitHubIcon";
import { ScrollArea } from "@/components/ui/scroll-area";

const steps = [
  {
    num: "1",
    text: "Tweak the pipeline using the <strong>Sticker</strong> preset in this sandbox.",
  },
  { num: "2", text: "Save the preset JSON to your project repo." },
];

export function AboutPanel() {
  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="p-4 space-y-4 text-xs text-gray-400 leading-relaxed">
        <p>
          Asset processing pipeline that runs entirely in the browser. Build
          pipelines with this editor, then run them in your web app with the
          <a
            href="https://www.npmjs.com/package/pipemagic"
            target="_blank"
            rel="noopener"
            className="text-gray-300 hover:text-white transition-colors"
          >
            pipemagic
          </a>
          runtime.
          <span className="text-gray-500"> Supports AI models via WebGPU — no server required.</span>
        </p>

        <a
          href="https://github.com/mo1app/pipemagic"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <GitHubIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span>View repository on GitHub</span>
        </a>

        <div className="pt-6 border-t border-gray-800">
          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-3">
            Example: Sticker Pipeline
          </div>
          <p className="text-gray-500 mb-3">
            Takes an image, removes background, crops, upscales, and adds an
            outline.
          </p>

          <ol className="space-y-3">
            {steps.map(step => (
              <li key={step.num} className="flex gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-800 text-gray-500 text-[10px] flex items-center justify-center mt-0.5">
                  {step.num}
                </span>
                <span dangerouslySetInnerHTML={{ __html: step.text }} />
              </li>
            ))}

            <li>
              <div className="flex gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-800 text-gray-500 text-[10px] flex items-center justify-center mt-0.5">
                  3
                </span>
                <span>Install the runtime:</span>
              </div>
              <code className="block mt-1.5 bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-[10px] text-green-400 font-mono">
                npm install pipemagic
              </code>
            </li>

            <li>
              <div className="flex gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-800 text-gray-500 text-[10px] flex items-center justify-center mt-0.5">
                  4
                </span>
                <span>Use it in your code:</span>
              </div>
              <ScrollArea className="mt-1.5 rounded border border-gray-800 bg-gray-950">
                <pre className="px-2.5 py-2 text-[10px] font-mono leading-relaxed whitespace-pre">
                  <span className="text-purple-400">import</span>{" "}
                  <span className="text-gray-300">&#123; PipeMagic &#125;</span>{" "}
                  <span className="text-purple-400">from</span>{" "}
                  <span className="text-green-400">'pipemagic'</span>
                  <span className="text-purple-400">\nimport</span>{" "}
                  <span className="text-gray-300">preset</span>{" "}
                  <span className="text-purple-400">from</span>{" "}
                  <span className="text-green-400">'./sticker.json'</span>
                  <span className="text-purple-400">\n\nconst</span>{" "}
                  <span className="text-gray-300">pm</span>{" "}
                  <span className="text-purple-400">=</span>{" "}
                  <span className="text-purple-400"> new</span>{" "}
                  <span className="text-blue-400"> PipeMagic</span>
                  <span className="text-gray-500">()</span>
                  <span className="text-purple-400">\nconst</span>{" "}
                  <span className="text-gray-300">&#123; blob &#125;</span>{" "}
                  <span className="text-purple-400">=</span>{" "}
                  <span className="text-purple-400"> await</span>{" "}
                  <span className="text-gray-300"> pm</span>
                  <span className="text-gray-500">.</span>
                  <span className="text-blue-400">run</span>
                  <span className="text-gray-500">(</span>
                  <span className="text-gray-300">preset</span>
                  <span className="text-gray-500">,</span>{" "}
                  <span className="text-gray-300">image</span>
                  <span className="text-gray-500">)</span>
                </pre>
              </ScrollArea>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default AboutPanel;
