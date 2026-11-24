import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import chatPlugin from './server/chatPlugin.js';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  // '' prefix: load ANTHROPIC_API_KEY server-side only (not exposed to the browser bundle)
  const env = loadEnv(mode, root, '');
  return { plugins: [react(), chatPlugin(env)] };
});
