import { serve } from "bun";
import index from "./index.html";

const coiServiceWorker = Bun.file(new URL("../public/coi-serviceworker.min.js", import.meta.url));

const server = serve({
  routes: {
    "/coi-serviceworker.min.js": coiServiceWorker,
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
