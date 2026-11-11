import { defineConfig } from 'vite';
// GitHub Pages (proyecto): https://<usuario>.github.io/website-3d/ ; en dev se sirve en '/'
export default defineConfig(({ command }) => ({ base: command === 'build' ? '/website-3d/' : '/', server: { host: true }, build: { chunkSizeWarningLimit: 900 }, worker: { format: 'es' } }));
