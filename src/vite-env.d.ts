/// <reference types="vite/client" />

// Environment variables available in the browser. Vite only exposes the ones
// that start with VITE_, so secrets must never be defined here.
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
