import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Replaces {{icon:name}} in HTML with the inline Lucide SVG (lucide-static),
// so there is no runtime icon request and icons follow `color`.
const inlineLucide = () => ({
  name: 'inline-lucide',
  transformIndexHtml: {
    order: 'pre',
    handler(html) {
      return html.replace(/\{\{icon:([a-z0-9-]+)\}\}/g, (_, name) => {
        const svg = readFileSync(resolve('node_modules/lucide-static/icons', `${name}.svg`), 'utf8');
        return svg
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/\sclass="[^"]*"/, '')
          .replace(/\swidth="24"/, '')
          .replace(/\sheight="24"/, '')
          .replace('<svg', '<svg aria-hidden="true" focusable="false"')
          .replace(/\s+/g, ' ')
          .replace(/> </g, '><')
          .trim();
      });
    },
  },
});

export default defineConfig({
  // Relative base: the build works from any path (GitHub Pages subfolder, Netlify, Vercel…).
  base: './',
  plugins: [inlineLucide()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
      },
    },
  },
});
