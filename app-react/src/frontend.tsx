/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

if (typeof document !== "undefined") {
  const existing = document.querySelector("script[data-coi-serviceworker]");
  if (!existing) {
    const script = document.createElement("script");
    script.src = "/coi-serviceworker.min.js";
    script.async = true;
    script.dataset.coiServiceworker = "true";
    document.head.appendChild(script);
  }
}

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}
