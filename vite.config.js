import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import manifest from './manifest.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    crx({ manifest }),
    viteStaticCopy({
      targets: [
        {
          src: 'src/locales',
          dest: '',
          rename: '_locales'
        }
      ]
    })
  ],
  build: {
    rollupOptions: {
      input: {
        // CRXJS will automatically handle these from manifest.json
      }
    },
    // Ensure compatibility with older browsers
    target: 'es2020',
    // Optimize output
    minify: 'esbuild',
    sourcemap: true
  },
  resolve: {
    alias: {
      // webextension-polyfill for cross-browser compatibility
      'webextension-polyfill': 'webextension-polyfill'
    }
  },
  // Ensure proper handling of web extension APIs
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
});
