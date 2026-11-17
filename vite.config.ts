import {defineConfig} from 'vite';
import mc from '@motion-canvas/vite-plugin';

// The vite-plugin ships as CommonJS; normalize the default export shape.
const motionCanvas = ((mc as unknown as {default?: typeof mc}).default ?? mc) as typeof mc;

export default defineConfig({
  plugins: [motionCanvas()],
  // Isolation: the prototype lives inside the Meko checkout, and vite
  // would otherwise discover Meko's own postcss/tailwind config upward.
  css: {
    postcss: {plugins: []},
  },
});
