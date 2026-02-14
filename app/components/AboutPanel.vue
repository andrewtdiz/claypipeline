<script setup lang="ts">
const steps = [
  {
    num: "1",
    text: "Tweak the pipeline using the <strong>Sticker</strong> preset in this sandbox.",
  },
  { num: "2", text: "Save the preset JSON to your project repo." },
];
</script>

<template>
  <div class="h-full flex flex-col overflow-y-auto">
    <div class="p-4 space-y-4 text-xs text-gray-400 leading-relaxed">
      <p>Open-source WebGPU asset processor with support for AI models.</p>
      <p>
        Create processing pipelines using the node-based canvas. Then use the
        standalone runtime to process assets in your web app.
        <span class="text-gray-500">No backend needed.</span>
      </p>

      <a
        href="https://github.com/mo1app/pipemagic"
        target="_blank"
        rel="noopener"
        class="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors"
      >
        <IconsGitHubIcon class="w-3.5 h-3.5 flex-shrink-0" />
        <span>View repository on GitHub</span>
      </a>

      <!-- Example section -->
      <div class="pt-6 border-t border-gray-800">
        <div
          class="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-3"
        >
          Example: Sticker Pipeline
        </div>
        <p class="text-gray-500 mb-3">
          Takes an image, removes background, crops, upscales, and adds an
          outline.
        </p>

        <ol class="space-y-3">
          <li v-for="step in steps" :key="step.num" class="flex gap-2">
            <span
              class="flex-shrink-0 w-4 h-4 rounded-full bg-gray-800 text-gray-500 text-[10px] flex items-center justify-center mt-0.5"
            >
              {{ step.num }}
            </span>
            <span v-html="step.text" />
          </li>

          <!-- Step 3 + npm install -->
          <li>
            <div class="flex gap-2">
              <span class="flex-shrink-0 w-4 h-4 rounded-full bg-gray-800 text-gray-500 text-[10px] flex items-center justify-center mt-0.5">3</span>
              <span>Install the runtime:</span>
            </div>
            <code class="block mt-1.5 bg-gray-950 border border-gray-800 rounded px-2.5 py-1.5 text-[10px] text-green-400 font-mono">
              npm install pipemagic
            </code>
          </li>

          <!-- Step 4 + code snippet -->
          <li>
            <div class="flex gap-2">
              <span class="flex-shrink-0 w-4 h-4 rounded-full bg-gray-800 text-gray-500 text-[10px] flex items-center justify-center mt-0.5">4</span>
              <span>Use it in your code:</span>
            </div>
            <pre
              class="mt-1.5 bg-gray-950 border border-gray-800 rounded px-2.5 py-2 text-[10px] font-mono leading-relaxed overflow-x-auto thin-scrollbar"
              ><span class="text-purple-400">import</span> <span class="text-gray-300">{ PipeMagic }</span> <span class="text-purple-400">from</span> <span class="text-green-400">'pipemagic'</span>
<span class="text-purple-400">import</span> <span class="text-gray-300">preset</span> <span class="text-purple-400">from</span> <span class="text-green-400">'./sticker.json'</span>

<span class="text-purple-400">const</span> <span class="text-gray-300">pm</span> <span class="text-purple-400">=</span> <span class="text-purple-400">new</span> <span class="text-blue-400">PipeMagic</span><span class="text-gray-500">()</span>
<span class="text-purple-400">const</span> <span class="text-gray-300">{ blob }</span> <span class="text-purple-400">=</span> <span class="text-purple-400">await</span> <span class="text-gray-300">pm</span><span class="text-gray-500">.</span><span class="text-blue-400">run</span><span class="text-gray-500">(</span><span class="text-gray-300">preset</span><span class="text-gray-500">,</span> <span class="text-gray-300">image</span><span class="text-gray-500">)</span></pre>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thin-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #374151 transparent;
}
.thin-scrollbar::-webkit-scrollbar {
  height: 4px;
}
.thin-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.thin-scrollbar::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 2px;
}
</style>
