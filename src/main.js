import App from "./App.svelte";
// Import debug utilities for browser console access
import "./utils/debug.js";

const app = new App({
  target: document.body,
  props: {},
  intro: true,
});

export default app;
