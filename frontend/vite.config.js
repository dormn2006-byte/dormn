import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Custom plugin: convert CSS <link> to non-render-blocking in production HTML
function deferCssPlugin() {
  return {
    name: 'defer-css',
    enforce: 'post',
    transformIndexHtml(html) {
      // Match Vite-injected CSS link tags and make them non-blocking
      return html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
        '<link rel="stylesheet" crossorigin href="$1" media="print" onload="this.media=\'all\'">' +
        '<noscript><link rel="stylesheet" crossorigin href="$1"></noscript>'
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), deferCssPlugin()],
  build: {
    target: 'es2020',
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('axios')) return 'axios';
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react')) return 'vendor';
          }
        },
      },
    },
  },
})